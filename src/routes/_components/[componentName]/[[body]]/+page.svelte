<script>
	import { pushState } from '$app/navigation';
	import { page } from '$app/state';

	let componentName = $derived(page.params['componentName']);
	let slotContent = $derived(page.params['body']);
	let props = $state(
		Object.fromEntries(
			Array(...page.url.searchParams.entries()).map(([k, v]) => {
				let value;
				if (v === '') {
					value = true;
				} else {
					try {
						value = JSON.parse(v);
					} catch (e) {
						value = v;
					}
				}
				return [k, value];
			})
		)
	);

	/** @type {string|undefined} */
	let title = $derived.by(() => {
		let out = `<${componentName}`;
		if (Object.keys(props).length > 0) {
			out +=
				' ' +
				Object.entries(props)
					.map(([k, v]) => (v === true ? k : `${k}=${JSON.stringify(v)}`))
					.join(' ');
		}
		if (slotContent) {
			out += `>${slotContent}</${componentName}>`;
		} else {
			out += '/>';
		}
		return out;
	});

	let wireframe = $state(false);

	/** @type {HTMLElement|undefined} */
	let componentDomNode = $state();
	let newPropKey = $state('');
	let newPropValue = $state('');
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>
<div class="content">
	<h1>{title}</h1>

	{#await import(`../../../../lib/${componentName}.svelte`) then component}
		<main class:wireframe bind:this={componentDomNode}>
			{#if slotContent}
				<component.default {...props}>
					{slotContent}
				</component.default>
			{:else}
				<component.default {...props} />
			{/if}
		</main>
		<section class="props">
			{#each Object.keys(props) as key (key)}
				<label for={`prop-${key}`}
					>{key}
					<input id={`prop-${key}`} type="text" bind:value={props[key]} />
					<button
						onclick={() => {
							let newURL = new URL(page.url);
							newURL.searchParams.delete(key);
							pushState(newURL, {});
							delete props[key];
						}}>del</button
					>
				</label>
			{/each}

			<div class="new-prop">
				<p>New prop</p>
				<input type="text" bind:value={newPropKey} />
				<input type="text" bind:value={newPropValue} />
				<button
					onclick={() => {
						try {
							props[newPropKey] = JSON.parse(newPropValue);
						} catch {
							props[newPropKey] = newPropValue;
						}
						newPropKey = '';
						newPropValue = '';
						let newURL = new URL(page.url);
						newURL.searchParams.set(newPropKey, newPropValue);
						pushState(newURL, {});
					}}>Add</button
				>
			</div>

			<label class="wireframe-toggle"
				>Show wireframe
				<input type="checkbox" bind:checked={wireframe} />
			</label>
		</section>
		{#if wireframe}
			<section class="info">
				<code
					>{componentDomNode?.getBoundingClientRect().width - 2} × {componentDomNode?.getBoundingClientRect()
						.height - 2}</code
				>
			</section>
		{/if}
	{:catch error}
		<section class="errored">
			<h2>Woops!</h2>
			<p>An error occured</p>
			<pre><code>{error}</code></pre>
		</section>
	{/await}
</div>

<style>
	section.errored {
		background: red;
		color: white;
		padding: 1em 2em;
		border-radius: 0.5em;
	}

	main.wireframe {
		border-color: black;
	}
	main {
		border: 1px solid transparent;
		display: inline-flex;
		box-sizing: content-box;
	}

	:global(body) {
		margin-bottom: 500px;
	}

	section.props {
		z-index: 1000000;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 0.5em;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10em, 1fr));
		gap: 1em;
		background: var(--bg);
	}

	section.props input {
		width: calc(100% - 100px);
	}
</style>
