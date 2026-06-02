<script lang="ts" module>
	let opener = $state<() => void>();

	export function askForPersistentStorageOnChrome() {
		opener?.();
	}
</script>

<script lang="ts">
	import ModalConfirm from '$lib/ModalConfirm.svelte';
	import { askForNotificationPermission } from '$lib/notifications.js';
</script>

<ModalConfirm
	key="modal_chrome_persistent_storage"
	title="Activer le stockage persistant sur Chrome"
	confirm="Activer les notifications"
	bind:open={opener}
	onconfirm={async () => {
		await askForNotificationPermission();
		await navigator.storage.persist();
	}}
>
	<p>Sur Chrome, pour activer le stockage persistant, il faut activer les notifications.</p>

	<p>
		Vous pourrez les désactiver en suite, l'acceptation des notifications sert à Chrome de
		signal pour prouver que le site vous ait suffisamment utile pour activer le stockage
		persistent.
	</p>

	<p>
		Sans stockage persistant, Chrome peut supprimer les données de l'application à tout moment,
		notamment lorsque l'espace de stockage est faible, ce qui peut entraîner la perte de vos
		sessions et modèles d'inférence enregistrés.
	</p>
</ModalConfirm>
