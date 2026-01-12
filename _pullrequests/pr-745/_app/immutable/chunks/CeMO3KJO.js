const g=t=>{u();const o=`linear-gradient(to bottom, 
			black calc(100% - 200px),
			rgba(0, 0, 0, calc(1 - var(--fade)))
		)`;t.style.maskImage=o,t.style.webkitMaskImage=o,t.style.transition="--fade 0.1s ease";const e=({target:s})=>{if(!(s instanceof HTMLElement))return;const n=s.scrollTop,c=s.scrollHeight,i=s.clientHeight,l=c-(n+i),d=Math.min(l/200,1);t.style.setProperty("--fade",d.toString())};e({target:t});const a=new MutationObserver(()=>{e({target:t})});return a.observe(t,{attributes:!0,childList:!0,subtree:!0,characterData:!0}),t.addEventListener("scroll",e),()=>{t.removeEventListener("scroll",e),a.disconnect()}};function u(){let t=document.querySelector("style[data-overflow-fade-styles]");const r=`
		@property --fade {
			syntax: '<number>';
			initial-value: 0;
			inherits: false;
		}
	`;t?t.textContent=r:(t=document.createElement("style"),t.setAttribute("data-overflow-fade-styles",""),t.textContent=r,document.head.appendChild(t))}export{g as s};
