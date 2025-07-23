// Simple message system for Cigale localization
import { getLocale } from '$lib/paraglide/runtime.js';
import frMessages from '../../messages/fr.json';
import enMessages from '../../messages/en.json';

const messages = {
	fr: frMessages,
	en: enMessages
};

function getMessage(key, params = {}) {
	const locale = getLocale();
	let message = messages[locale]?.[key] || messages['fr'][key] || key;

	// Replace parameters in the message
	if (params && typeof params === 'object') {
		Object.keys(params).forEach((param) => {
			const value = params[param];
			message = message.replace(new RegExp(`\\{${param}\\}`, 'g'), value);
		});
	}

	return message;
}

// Create the m object with all message functions
export const m = {
	// Original messages
	home: (params) => getMessage('home', params),
	preview_pr_number: (params) => getMessage('preview_pr_number', params),
	protocol_tab: (params) => getMessage('protocol_tab', params),
	classify_tab: (params) => getMessage('classify_tab', params),
	results: (params) => getMessage('results', params),
	no_protocol_selected: (params) => getMessage('no_protocol_selected', params),
	import_tab: (params) => getMessage('import_tab', params),
	crop_tab: (params) => getMessage('crop_tab', params),
	error_while_exporting_results: (params) => getMessage('error_while_exporting_results', params),
	unexpected_error: (params) => getMessage('unexpected_error', params),
	export_results: (params) => getMessage('export_results', params),
	metadata_only: (params) => getMessage('metadata_only', params),
	metadata_and_cropped_images: (params) => getMessage('metadata_and_cropped_images', params),
	metadata_cropped_and_full_images: (params) =>
		getMessage('metadata_cropped_and_full_images', params),
	allows_reusing_export_later: (params) => getMessage('allows_reusing_export_later', params),
	padding_around_cropped_images: (params) => getMessage('padding_around_cropped_images', params),
	in_percent_of_image_dimensions: (params) => getMessage('in_percent_of_image_dimensions', params),
	in_pixels: (params) => getMessage('in_pixels', params),
	preview_deployment_for_pr_no: (params) => getMessage('preview_deployment_for_pr_no', params),
	preview_deployment_for_pr_no__html: (params) =>
		getMessage('preview_deployment_for_pr_no__html', params),
	preview_deployment_for_issue_no__html: (params) =>
		getMessage('preview_deployment_for_issue_no__html', params),
	preview_deployment_is_for_loaded_first_part: (params) =>
		getMessage('preview_deployment_is_for_loaded_first_part', params),
	preview_deployment_is_for_loaded_second_part__html: (params) =>
		getMessage('preview_deployment_is_for_loaded_second_part__html', params),
	preview_deployment_cleanup_database: (params) =>
		getMessage('preview_deployment_cleanup_database', params),
	preview_deployment_cleanup_database_help: (params) =>
		getMessage('preview_deployment_cleanup_database_help', params),
	preview_deployment_view_on_github: (params) =>
		getMessage('preview_deployment_view_on_github', params),
	preview_deployment_e2e_tests: (params) => getMessage('preview_deployment_e2e_tests', params),
	preview_deployment_unit_tests: (params) => getMessage('preview_deployment_unit_tests', params),
	preview_deployment_coverage: (params) => getMessage('preview_deployment_coverage', params),
	crop_padding_relative_values_explainer: (params) =>
		getMessage('crop_padding_relative_values_explainer', params),
	no_need_for_ctrl_s: (params) => getMessage('no_need_for_ctrl_s', params),

	// New localized messages
	detection_model_not_loaded: (params) => getMessage('detection_model_not_loaded', params),
	file_not_found: (params) => getMessage('file_not_found', params),
	classification_model_not_loaded: (params) =>
		getMessage('classification_model_not_loaded', params),
	checking_for_updates: (params) => getMessage('checking_for_updates', params),
	update: (params) => getMessage('update', params),
	protocol_up_to_date_click_to_check_again: (params) =>
		getMessage('protocol_up_to_date_click_to_check_again', params),
	up_to_date: (params) => getMessage('up_to_date', params),
	protocol_updated_to_version: (params) => getMessage('protocol_updated_to_version', params),
	cannot_update_protocol: (params) => getMessage('cannot_update_protocol', params),
	update_available_to_version: (params) => getMessage('update_available_to_version', params),
	updating: (params) => getMessage('updating', params),
	cannot_check_for_updates: (params) => getMessage('cannot_check_for_updates', params),
	retry: (params) => getMessage('retry', params),
	protocol_does_not_support_update_check: (params) =>
		getMessage('protocol_does_not_support_update_check', params),
	protocol_not_versioned_help: (params) => getMessage('protocol_not_versioned_help', params),
	not_versioned: (params) => getMessage('not_versioned', params),
	close: (params) => getMessage('close', params),
	settings: (params) => getMessage('settings', params),
	theme: (params) => getMessage('theme', params),
	sync_with_system_theme: (params) => getMessage('sync_with_system_theme', params),
	french: (params) => getMessage('french', params),
	manage_protocols: (params) => getMessage('manage_protocols', params),
	about: (params) => getMessage('about', params),
	no_inference: (params) => getMessage('no_inference', params),
	remote_protocol_import_confirm: (params) => getMessage('remote_protocol_import_confirm', params),
	selected_protocol: (params) => getMessage('selected_protocol', params),
	inference_model_for: (params) => getMessage('inference_model_for', params),
	inference_model_for_detection: (params) => getMessage('inference_model_for_detection', params),
	protocol_imported_and_selected: (params) => getMessage('protocol_imported_and_selected', params),
	developed_by: (params) => getMessage('developed_by', params),
	with_data: (params) => getMessage('with_data', params),
	identification_aids: (params) => getMessage('identification_aids', params),
	with_models: (params) => getMessage('with_models', params),
	detection_and_cropping: (params) => getMessage('detection_and_cropping', params),
	icons: (params) => getMessage('icons', params),
	thanks_to_libraries: (params) => getMessage('thanks_to_libraries', params),
	loading_dependencies: (params) => getMessage('loading_dependencies', params),
	cannot_load_dependencies: (params) => getMessage('cannot_load_dependencies', params),
	image_n_of_selection: (params) => getMessage('image_n_of_selection', params),
	select_images_to_view_metadata: (params) => getMessage('select_images_to_view_metadata', params),
	group_selected_items: (params) => getMessage('group_selected_items', params),
	separate_selected_observations: (params) => getMessage('separate_selected_observations', params),
	separate: (params) => getMessage('separate', params),
	delete_selected_images_warning: (params) => getMessage('delete_selected_images_warning', params),
	delete_selected_items: (params) => getMessage('delete_selected_items', params),
	no_inference_params_defined: (params) => getMessage('no_inference_params_defined', params),
	classification_model_loaded: (params) => getMessage('classification_model_loaded', params),
	error_loading_classification_model: (params) =>
		getMessage('error_loading_classification_model', params),
	loading_classification_model: (params) => getMessage('loading_classification_model', params),
	click_or_drop_images_here: (params) => getMessage('click_or_drop_images_here', params),
	cannot_load_classification_model: (params) =>
		getMessage('cannot_load_classification_model', params),
	error_extracting_exif_metadata: (params) => getMessage('error_extracting_exif_metadata', params),
	detection_model_loaded: (params) => getMessage('detection_model_loaded', params),
	error_loading_detection_model: (params) => getMessage('error_loading_detection_model', params),
	loading_cropping_model: (params) => getMessage('loading_cropping_model', params),
	click_or_drop_images_or_export: (params) => getMessage('click_or_drop_images_or_export', params),
	cannot_load_cropping_model: (params) => getMessage('cannot_load_cropping_model', params),
	warning_deletes_all_data: (params) => getMessage('warning_deletes_all_data', params),
	reset_database: (params) => getMessage('reset_database', params),
	create: (params) => getMessage('create', params)
};
