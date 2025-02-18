<h1>Color Palette</h1>

{#snippet swatch(name, textcolor = "light")}
    <div 
        role="button"
        class="color-square" 
        class:dark-text={textcolor === "dark"} 
        style="background-color: var(--{name});"
        onclick={async () => { await navigator.clipboard.writeText(`var(--${name})`) }}
        title="Copier var(--{name})"
    >
        --{name}
    </div>
{/snippet}

<div class="palette">
  {@render swatch("bg-primary", "light")}
  {@render swatch("bg-primary-translucent", "dark")}
  {@render swatch("fg-primary", "light")}
  {@render swatch("bg-dark-primary", "light")}
  {@render swatch("fg-dark-primary", "light")}
  {@render swatch("bg-warning", "dark")}
  {@render swatch("fg-warning", "dark")}
  {@render swatch("bg-error", "dark")}
  {@render swatch("fg-error", "light")}
  {@render swatch("bg-success", "dark")}
  {@render swatch("fg-success", "light")}
  {@render swatch("bg-neutral", "dark")}
  {@render swatch("fg-neutral", "light")}
</div>


<style>
    .palette {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
        background-color: var(--bg-neutral);
        color: var(--fg-neutral);
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 20px;
    }

    .color-square {
        width: 150px;
        height: 150px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        text-align: center;
        font-size: 14px;
        color: white;
        cursor: pointer;
        border: 3px solid transparent;
    }

    .color-square:is(:hover, :focus-visible) {
        border-color: white;
    }

    .color-square.dark-text {
        color: black;
    }

    .color-square.dark-text:is(:hover, :focus-visible) {
        border-color: black;
    }
</style>