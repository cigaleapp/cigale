export class IsMobile {
	width = $state(0);
	current = $derived(this.width < 600);

	constructor() {
		$effect(() => {
			this.width = window.innerWidth;
			const handler = () => {
				this.width = window.innerWidth;
			};

			window.addEventListener('resize', handler);
			return () => window.removeEventListener('resize', handler);
		});
	}
}
