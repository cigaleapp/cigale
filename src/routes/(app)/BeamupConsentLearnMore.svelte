<script>
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonPrimary from '$lib/ButtonPrimary.svelte';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import Modal from '$lib/Modal.svelte';
	import { getSettings, setSetting } from '$lib/settings.svelte';
	import IconInfo from '~icons/ph/question';

	/**
	 * @typedef {object} Props
	 * @property {typeof import('$lib/schemas/protocols').BeamupSettings.infer} config
	 * @property {string} protocol
	 */

	/** @type {Props}*/
	const { config, protocol } = $props();

	/** @type{undefined | (() => void)}*/
	let open = $state();

	const domain = $derived.by(() => {
		if (!URL.canParse(config.origin)) return config.origin;

		const { host, protocol } = new URL(config.origin);
		return `${protocol}//${host}`;
	});

	const publicDataUrl = $derived(new URL(`/corrections/${protocol}`, config.origin));
</script>

<Modal
	key="modal_beamup_consent_learn_more"
	title="Remontée de données d'usage anonymisées"
	bind:open
>
	<p>
		Quand une métadonnée est modifiée manuellement après avoir été inférée automatiquement par un
		modèle, cette correction peut être remontée aux auteurices du protocole pour améliorer les
		modèles d'inférence.
	</p>

	<p>
		Pour cela, si vous activez cette option, et quand ce protocole est sélectionné, Cigale enverra
		les données suivantes au <a target="_blank" href={config.origin}>serveur BeamUp à {domain}</a>
	</p>

	<ul>
		<li>Nom et version du protocole</li>
		<li>Version actuelle de CIGALE</li>
		<li>Date et heure de la modification</li>
		<li>Identifiant de la métadonnée ayant été modifiée</li>
		<li>Valeur, score de confiance et alternatives avant modification</li>
		<li>Valeur, score de confiance et alternatives après modification</li>
		<li>
			Identifiant et <a target="_blank" href="https://fr.wikipedia.org/wiki/Hash">hash</a> du/des fichier(s)
			photos de l'observation ayant été modifiée
		</li>
	</ul>

	<p>
		Il n'y a pas besoin d'être connecté·e à Internet au moment où l'on corrige la métadonnée, les
		corrections sont stockées localement et envoyées au prochain démarrage de l'appli, quand une
		connexion est disponible.
	</p>

	<p>
		L'entièreté de ces données sont publiquement accessibles à <a
			target="_blank"
			href={publicDataUrl.href}
		>
			{publicDataUrl.href}
		</a>
	</p>
	<section class="email">
		<p>
			Si vous le souhaitez, vous pouvez aussi renseigner une addresse e-mail, pour éventuellement
			être contacté·e
		</p>

		<InlineTextInput
			label="Addresse e-mail"
			value={getSettings().beamupPreferences[protocol]?.email ?? ''}
			onblur={async (email) => {
				await setSetting('beamupPreferences', {
					...getSettings().beamupPreferences,
					[protocol]: {
						enable: true,
						email: email.trim() || null
					}
				});
			}}
		/>
	</section>

	{#snippet footer({ close })}
		<ButtonPrimary onclick={() => close?.()}>OK</ButtonPrimary>
	{/snippet}
</Modal>

<ButtonIcon help="En savoir plus" onclick={() => open?.()}>
	<IconInfo />
</ButtonIcon>

<style>
	.email {
		display: flex;
		flex-direction: column;
		text-align: center;
		gap: 0.5em;
		max-width: 400px;
		margin: 1em auto;
	}
</style>
