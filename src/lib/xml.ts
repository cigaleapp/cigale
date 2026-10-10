type ScalarTree = XmlNode | undefined | string | number | boolean | { [key: string]: ScalarTree };

export class XmlNode {
	children: XmlNode[];
	textContent = '';
	attributes: Record<string, string | number | undefined> = {};
	tag: '#text' | '#comment' | (string & {});

	constructor(tag: typeof this.tag, ...children: XmlNode[]);
	constructor(tag: typeof this.tag, text: string);
	constructor(tag: typeof this.tag, attributes: typeof this.attributes, ...children: XmlNode[]);
	constructor(tag: typeof this.tag, attributes: typeof this.attributes, text: string);
	constructor(
		tag: typeof this.tag,
		...args:
			| XmlNode[]
			| [string]
			| [typeof this.attributes, ...XmlNode[]]
			| [typeof this.attributes, string]
	) {
		this.tag = tag;
		const [second, third, ...rest] = args;
		this.children = [];
		this.attributes = {};
		if (!second) return;

		if (typeof second === 'string' || second instanceof XmlNode) {
			return new XmlNode(tag, {}, ...args);
		}

		this.attributes = second;
		if (typeof third === 'string') {
			this.children = [XmlNode.text(third)];
		} else if (third) {
			this.children = [third, ...rest];
		}
	}

	static text(text: string) {
		const node = new XmlNode('#text');
		node.textContent = text;
		return node;
	}

	static comment(text: string) {
		const node = new XmlNode('#comment');
		node.textContent = text;
		return node;
	}

	static nested(tag: string, tree: Record<string, ScalarTree>): XmlNode {
		return new XmlNode(
			tag,
			...Object.entries(tree).flatMap(([key, value]) => {
				if (value === undefined) return [];
				if (value instanceof XmlNode) return [value];
				if (typeof value === 'object') return [XmlNode.nested(key, value)];
				return [new XmlNode(key, value.toString())];
			})
		);
	}

	get selfClosing() {
		return this.children.length === 0;
	}

	/**
	 *
	 * @param inner don't add <?xml ?> marker at the start if this is false
	 * @returns
	 */
	toString(inner = false): string {
		const marker = inner ? '' : '<?xml version="1.0" encoding="UTF-8"?>\n';

		if (this.tag === '#text') {
			return this.textContent;
		}

		if (this.tag === '#comment') {
			return `<!-- ${this.textContent} -->`;
		}

		const attributes = Object.entries(this.attributes)
			.filter(([, value]) => value !== undefined)
			.map(([key, value]) => `${key}=${JSON.stringify(value!.toString())}`)
			.join(' ');

		const opening = attributes ? `${this.tag} ${attributes}` : this.tag;

		if (this.selfClosing) {
			return marker + `<${opening} />`;
		}

		const children = this.children
			.map((child) => '\t' + child.toString(true).replaceAll('\n', '\n\t'))
			.join('\n');

		return marker + `<${opening}>\n${children}\n</${this.tag}>`;
	}
}

if (import.meta.vitest) {
	const { test, describe, expect } = import.meta.vitest;

	describe('XmlNode', () => {
		test('no children', () => {
			expect(new XmlNode('example', { a: 3, foo: 'bar' }).toString()).toMatchInlineSnapshot(`
				"<?xml version="1.0" encoding="UTF-8"?>
				<example a="3" foo="bar" />"
			`);
		});

		test('text fragment', () => {
			expect(XmlNode.text('an example right there').toString()).toMatchInlineSnapshot(
				`"an example right there"`
			);
		});

		test('nested', async () => {
			const tree = new XmlNode(
				'wrapper',
				{ 'some-thing': 'here' },
				new XmlNode('inner', 'some text here'),
				new XmlNode('another', { hmmm: 'yes' })
			);

			expect(tree.toString()).toMatchInlineSnapshot(`
				"<?xml version="1.0" encoding="UTF-8"?>
				<wrapper some-thing="here">
					<inner>
						some text here
					</inner>
					<another hmmm="yes" />
				</wrapper>"
			`);

			const { XMLParser } = await import('fast-xml-parser');

			const parsed = new XMLParser().parse(tree.toString());
			expect(parsed).toMatchInlineSnapshot(`
				{
				  "?xml": "",
				  "wrapper": {
				    "another": "",
				    "inner": "some text here",
				  },
				}
			`);
		});
	});
}
