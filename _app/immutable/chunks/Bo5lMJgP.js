import{lt as e}from"./BP9o3e7s.js";var t=(t=`y`,r)=>i=>{r??=e(t,{y:200,x:30}),n();let a=`linear-gradient(to ${e(t,{y:`bottom`,x:`right`})}, 
				black calc(100% - ${r}px),
				rgba(0, 0, 0, calc(1 - var(--fade)))
			)`;i.style.maskImage=a,i.style.webkitMaskImage=a,i.style.transition=`--fade 0.1s ease`;let o=({target:n})=>{if(!(n instanceof HTMLElement))return;let a=n.scrollTop,o=n.scrollHeight,s=n.clientHeight,c=n.clientWidth,l=n.scrollLeft,u=n.scrollWidth,d=e(t,{y:o-(a+s),x:u-(l+c)}),f=Math.min(d/r,1);i.style.setProperty(`--fade`,f.toString())};o({target:i});let s=new MutationObserver(()=>{o({target:i})});return s.observe(i,{attributes:!0,childList:!0,subtree:!0,characterData:!0}),i.addEventListener(`scroll`,o),()=>{i.removeEventListener(`scroll`,o),s.disconnect()}};function n(){let e=document.querySelector(`style[data-overflow-fade-styles]`),t=`
		@property --fade {
			syntax: '<number>';
			initial-value: 0;
			inherits: false;
		}
	`;e?e.textContent=t:(e=document.createElement(`style`),e.setAttribute(`data-overflow-fade-styles`,``),e.textContent=t,document.head.appendChild(e))}export{t};