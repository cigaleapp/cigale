"""
generate_fixed_score_model.py

Generate an ONNX model that accepts an image tensor and always returns
the same fixed classification scores.

Requirements:

	pip install onnx onnxscript numpy

Example:

	python generate_fixed_score_model.py \
		--shape 3 224 224 \
		--scores 0.1 0.2 0.5 0.15 0.05 \

Input:
	float32 tensor [B,C,H,W]

Output:
	float32 tensor [B,N]

For every batch element, the output row equals the supplied scores.
"""

import argparse
import sys

import numpy as np
import onnx
from onnx import TensorProto, checker, helper, numpy_helper


def build_model(channels, height, width, scores):
	num_classes = len(scores)

	flat = channels * height * width

	input_tensor = helper.make_tensor_value_info(
		"input",
		TensorProto.FLOAT,
		[None, channels, height, width],
	)

	output_tensor = helper.make_tensor_value_info(
		"output",
		TensorProto.FLOAT,
		[None, num_classes],
	)

	reshape_shape = numpy_helper.from_array(
		np.array([-1, flat], dtype=np.int64),
		name="reshape_shape",
	)

	weights = numpy_helper.from_array(
		np.zeros((flat, num_classes), dtype=np.float32),
		name="weights",
	)

	bias = numpy_helper.from_array(
		np.array(scores, dtype=np.float32),
		name="bias",
	)

	reshape = helper.make_node(
		"Reshape",
		["input", "reshape_shape"],
		["flat"],
	)

	matmul = helper.make_node(
		"MatMul",
		["flat", "weights"],
		["matmul_out"],
	)

	add = helper.make_node(
		"Add",
		["matmul_out", "bias"],
		["output"],
	)

	graph = helper.make_graph(
		[reshape, matmul, add],
		"fixed_score_model",
		[input_tensor],
		[output_tensor],
		initializer=[
			reshape_shape,
			weights,
			bias,
		],
	)

	model = helper.make_model(
		graph,
		producer_name="generate_fixed_score_model",
		opset_imports=[
			helper.make_opsetid("", 13),
		],
	)

	model.ir_version = 8

	checker.check_model(model)

	return model


def main():
	parser = argparse.ArgumentParser()

	parser.add_argument(
		"--shape",
		nargs=3,
		type=int,
		metavar=("C", "H", "W"),
		required=True,
		help="Input tensor shape.",
	)

	parser.add_argument(
		"--scores",
		nargs="+",
		type=float,
		required=True,
		help="Fixed output scores.",
	)

	args = parser.parse_args()

	c, h, w = args.shape

	model = build_model( c, h, w, args.scores)

	onnx.save(model, sys.stdout.buffer)


if __name__ == "__main__":
	main()
