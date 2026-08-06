var e=e=>{t();let n=`linear-gradient(to bottom, 
			black calc(100% - 200px),
			rgba(0, 0, 0, calc(1 - var(--fade)))
		)`;e.style.maskImage=n,e.style.webkitMaskImage=n,e.style.transition=`--fade 0.1s ease`;let r=({target:t})=>{if(!(t instanceof HTMLElement))return;let n=t.scrollTop,r=t.scrollHeight-(n+t.clientHeight),i=Math.min(r/200,1);e.style.setProperty(`--fade`,i.toString())};r({target:e});let i=new MutationObserver(()=>{r({target:e})});return i.observe(e,{attributes:!0,childList:!0,subtree:!0,characterData:!0}),e.addEventListener(`scroll`,r),()=>{e.removeEventListener(`scroll`,r),i.disconnect()}};function t(){let e=document.querySelector(`style[data-overflow-fade-styles]`),t=`
		@property --fade {
			syntax: '<number>';
			initial-value: 0;
			inherits: false;
		}
	`;e?e.textContent=t:(e=document.createElement(`style`),e.setAttribute(`data-overflow-fade-styles`,``),e.textContent=t,document.head.appendChild(e))}export{e as t};