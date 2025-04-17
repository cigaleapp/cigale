import{D as fr,G as cr,F as pr,aw as dr,aV as lr}from"./CfN1TJh4.js";function Gn(e,t,r){fr(()=>{var n=cr(()=>t(e,r==null?void 0:r())||{});if(r&&(n!=null&&n.update)){var a=!1,o={};pr(()=>{var u=r();dr(u),a&&lr(o,u)&&(o=u,n.update(u))}),a=!0}if(n!=null&&n.destroy)return()=>n.destroy()})}var W="top",z="bottom",Y="right",N="left",mt="auto",je=[W,z,Y,N],ge="start",Re="end",vr="clippingParents",Ft="viewport",De="popper",mr="reference",Et=je.reduce(function(e,t){return e.concat([t+"-"+ge,t+"-"+Re])},[]),Ut=[].concat(je,[mt]).reduce(function(e,t){return e.concat([t,t+"-"+ge,t+"-"+Re])},[]),hr="beforeRead",gr="read",yr="afterRead",br="beforeMain",wr="main",Or="afterMain",xr="beforeWrite",Ar="write",Er="afterWrite",Tr=[hr,gr,yr,br,wr,Or,xr,Ar,Er];function ie(e){return e?(e.nodeName||"").toLowerCase():null}function U(e){if(e==null)return window;if(e.toString()!=="[object Window]"){var t=e.ownerDocument;return t&&t.defaultView||window}return e}function le(e){var t=U(e).Element;return e instanceof t||e instanceof Element}function X(e){var t=U(e).HTMLElement;return e instanceof t||e instanceof HTMLElement}function ht(e){if(typeof ShadowRoot>"u")return!1;var t=U(e).ShadowRoot;return e instanceof t||e instanceof ShadowRoot}function Dr(e){var t=e.state;Object.keys(t.elements).forEach(function(r){var n=t.styles[r]||{},a=t.attributes[r]||{},o=t.elements[r];!X(o)||!ie(o)||(Object.assign(o.style,n),Object.keys(a).forEach(function(u){var c=a[u];c===!1?o.removeAttribute(u):o.setAttribute(u,c===!0?"":c)}))})}function Cr(e){var t=e.state,r={popper:{position:t.options.strategy,left:"0",top:"0",margin:"0"},arrow:{position:"absolute"},reference:{}};return Object.assign(t.elements.popper.style,r.popper),t.styles=r,t.elements.arrow&&Object.assign(t.elements.arrow.style,r.arrow),function(){Object.keys(t.elements).forEach(function(n){var a=t.elements[n],o=t.attributes[n]||{},u=Object.keys(t.styles.hasOwnProperty(n)?t.styles[n]:r[n]),c=u.reduce(function(s,d){return s[d]="",s},{});!X(a)||!ie(a)||(Object.assign(a.style,c),Object.keys(o).forEach(function(s){a.removeAttribute(s)}))})}}const Sr={name:"applyStyles",enabled:!0,phase:"write",fn:Dr,effect:Cr,requires:["computeStyles"]};function ne(e){return e.split("-")[0]}var de=Math.max,Ze=Math.min,ye=Math.round;function ct(){var e=navigator.userAgentData;return e!=null&&e.brands&&Array.isArray(e.brands)?e.brands.map(function(t){return t.brand+"/"+t.version}).join(" "):navigator.userAgent}function qt(){return!/^((?!chrome|android).)*safari/i.test(ct())}function be(e,t,r){t===void 0&&(t=!1),r===void 0&&(r=!1);var n=e.getBoundingClientRect(),a=1,o=1;t&&X(e)&&(a=e.offsetWidth>0&&ye(n.width)/e.offsetWidth||1,o=e.offsetHeight>0&&ye(n.height)/e.offsetHeight||1);var u=le(e)?U(e):window,c=u.visualViewport,s=!qt()&&r,d=(n.left+(s&&c?c.offsetLeft:0))/a,p=(n.top+(s&&c?c.offsetTop:0))/o,b=n.width/a,w=n.height/o;return{width:b,height:w,top:p,right:d+b,bottom:p+w,left:d,x:d,y:p}}function gt(e){var t=be(e),r=e.offsetWidth,n=e.offsetHeight;return Math.abs(t.width-r)<=1&&(r=t.width),Math.abs(t.height-n)<=1&&(n=t.height),{x:e.offsetLeft,y:e.offsetTop,width:r,height:n}}function Xt(e,t){var r=t.getRootNode&&t.getRootNode();if(e.contains(t))return!0;if(r&&ht(r)){var n=t;do{if(n&&e.isSameNode(n))return!0;n=n.parentNode||n.host}while(n)}return!1}function ae(e){return U(e).getComputedStyle(e)}function Lr(e){return["table","td","th"].indexOf(ie(e))>=0}function se(e){return((le(e)?e.ownerDocument:e.document)||window.document).documentElement}function tt(e){return ie(e)==="html"?e:e.assignedSlot||e.parentNode||(ht(e)?e.host:null)||se(e)}function Tt(e){return!X(e)||ae(e).position==="fixed"?null:e.offsetParent}function Mr(e){var t=/firefox/i.test(ct()),r=/Trident/i.test(ct());if(r&&X(e)){var n=ae(e);if(n.position==="fixed")return null}var a=tt(e);for(ht(a)&&(a=a.host);X(a)&&["html","body"].indexOf(ie(a))<0;){var o=ae(a);if(o.transform!=="none"||o.perspective!=="none"||o.contain==="paint"||["transform","perspective"].indexOf(o.willChange)!==-1||t&&o.willChange==="filter"||t&&o.filter&&o.filter!=="none")return a;a=a.parentNode}return null}function Pe(e){for(var t=U(e),r=Tt(e);r&&Lr(r)&&ae(r).position==="static";)r=Tt(r);return r&&(ie(r)==="html"||ie(r)==="body"&&ae(r).position==="static")?t:r||Mr(e)||t}function yt(e){return["top","bottom"].indexOf(e)>=0?"x":"y"}function Se(e,t,r){return de(e,Ze(t,r))}function Rr(e,t,r){var n=Se(e,t,r);return n>r?r:n}function zt(){return{top:0,right:0,bottom:0,left:0}}function Yt(e){return Object.assign({},zt(),e)}function Gt(e,t){return t.reduce(function(r,n){return r[n]=e,r},{})}var Br=function(t,r){return t=typeof t=="function"?t(Object.assign({},r.rects,{placement:r.placement})):t,Yt(typeof t!="number"?t:Gt(t,je))};function jr(e){var t,r=e.state,n=e.name,a=e.options,o=r.elements.arrow,u=r.modifiersData.popperOffsets,c=ne(r.placement),s=yt(c),d=[N,Y].indexOf(c)>=0,p=d?"height":"width";if(!(!o||!u)){var b=Br(a.padding,r),w=gt(o),m=s==="y"?W:N,x=s==="y"?z:Y,h=r.rects.reference[p]+r.rects.reference[s]-u[s]-r.rects.popper[p],y=u[s]-r.rects.reference[s],A=Pe(o),D=A?s==="y"?A.clientHeight||0:A.clientWidth||0:0,S=h/2-y/2,i=b[m],O=D-w[p]-b[x],l=D/2-w[p]/2+S,C=Se(i,l,O),j=s;r.modifiersData[n]=(t={},t[j]=C,t.centerOffset=C-l,t)}}function Pr(e){var t=e.state,r=e.options,n=r.element,a=n===void 0?"[data-popper-arrow]":n;a!=null&&(typeof a=="string"&&(a=t.elements.popper.querySelector(a),!a)||Xt(t.elements.popper,a)&&(t.elements.arrow=a))}const $r={name:"arrow",enabled:!0,phase:"main",fn:jr,effect:Pr,requires:["popperOffsets"],requiresIfExists:["preventOverflow"]};function we(e){return e.split("-")[1]}var Vr={top:"auto",right:"auto",bottom:"auto",left:"auto"};function kr(e,t){var r=e.x,n=e.y,a=t.devicePixelRatio||1;return{x:ye(r*a)/a||0,y:ye(n*a)/a||0}}function Dt(e){var t,r=e.popper,n=e.popperRect,a=e.placement,o=e.variation,u=e.offsets,c=e.position,s=e.gpuAcceleration,d=e.adaptive,p=e.roundOffsets,b=e.isFixed,w=u.x,m=w===void 0?0:w,x=u.y,h=x===void 0?0:x,y=typeof p=="function"?p({x:m,y:h}):{x:m,y:h};m=y.x,h=y.y;var A=u.hasOwnProperty("x"),D=u.hasOwnProperty("y"),S=N,i=W,O=window;if(d){var l=Pe(r),C="clientHeight",j="clientWidth";if(l===U(r)&&(l=se(r),ae(l).position!=="static"&&c==="absolute"&&(C="scrollHeight",j="scrollWidth")),l=l,a===W||(a===N||a===Y)&&o===Re){i=z;var B=b&&l===O&&O.visualViewport?O.visualViewport.height:l[C];h-=B-n.height,h*=s?1:-1}if(a===N||(a===W||a===z)&&o===Re){S=Y;var L=b&&l===O&&O.visualViewport?O.visualViewport.width:l[j];m-=L-n.width,m*=s?1:-1}}var P=Object.assign({position:c},d&&Vr),M=p===!0?kr({x:m,y:h},U(r)):{x:m,y:h};if(m=M.x,h=M.y,s){var R;return Object.assign({},P,(R={},R[i]=D?"0":"",R[S]=A?"0":"",R.transform=(O.devicePixelRatio||1)<=1?"translate("+m+"px, "+h+"px)":"translate3d("+m+"px, "+h+"px, 0)",R))}return Object.assign({},P,(t={},t[i]=D?h+"px":"",t[S]=A?m+"px":"",t.transform="",t))}function Hr(e){var t=e.state,r=e.options,n=r.gpuAcceleration,a=n===void 0?!0:n,o=r.adaptive,u=o===void 0?!0:o,c=r.roundOffsets,s=c===void 0?!0:c,d={placement:ne(t.placement),variation:we(t.placement),popper:t.elements.popper,popperRect:t.rects.popper,gpuAcceleration:a,isFixed:t.options.strategy==="fixed"};t.modifiersData.popperOffsets!=null&&(t.styles.popper=Object.assign({},t.styles.popper,Dt(Object.assign({},d,{offsets:t.modifiersData.popperOffsets,position:t.options.strategy,adaptive:u,roundOffsets:s})))),t.modifiersData.arrow!=null&&(t.styles.arrow=Object.assign({},t.styles.arrow,Dt(Object.assign({},d,{offsets:t.modifiersData.arrow,position:"absolute",adaptive:!1,roundOffsets:s})))),t.attributes.popper=Object.assign({},t.attributes.popper,{"data-popper-placement":t.placement})}const Ir={name:"computeStyles",enabled:!0,phase:"beforeWrite",fn:Hr,data:{}};var Ke={passive:!0};function Wr(e){var t=e.state,r=e.instance,n=e.options,a=n.scroll,o=a===void 0?!0:a,u=n.resize,c=u===void 0?!0:u,s=U(t.elements.popper),d=[].concat(t.scrollParents.reference,t.scrollParents.popper);return o&&d.forEach(function(p){p.addEventListener("scroll",r.update,Ke)}),c&&s.addEventListener("resize",r.update,Ke),function(){o&&d.forEach(function(p){p.removeEventListener("scroll",r.update,Ke)}),c&&s.removeEventListener("resize",r.update,Ke)}}const Nr={name:"eventListeners",enabled:!0,phase:"write",fn:function(){},effect:Wr,data:{}};var Fr={left:"right",right:"left",bottom:"top",top:"bottom"};function Qe(e){return e.replace(/left|right|bottom|top/g,function(t){return Fr[t]})}var Ur={start:"end",end:"start"};function Ct(e){return e.replace(/start|end/g,function(t){return Ur[t]})}function bt(e){var t=U(e),r=t.pageXOffset,n=t.pageYOffset;return{scrollLeft:r,scrollTop:n}}function wt(e){return be(se(e)).left+bt(e).scrollLeft}function qr(e,t){var r=U(e),n=se(e),a=r.visualViewport,o=n.clientWidth,u=n.clientHeight,c=0,s=0;if(a){o=a.width,u=a.height;var d=qt();(d||!d&&t==="fixed")&&(c=a.offsetLeft,s=a.offsetTop)}return{width:o,height:u,x:c+wt(e),y:s}}function Xr(e){var t,r=se(e),n=bt(e),a=(t=e.ownerDocument)==null?void 0:t.body,o=de(r.scrollWidth,r.clientWidth,a?a.scrollWidth:0,a?a.clientWidth:0),u=de(r.scrollHeight,r.clientHeight,a?a.scrollHeight:0,a?a.clientHeight:0),c=-n.scrollLeft+wt(e),s=-n.scrollTop;return ae(a||r).direction==="rtl"&&(c+=de(r.clientWidth,a?a.clientWidth:0)-o),{width:o,height:u,x:c,y:s}}function Ot(e){var t=ae(e),r=t.overflow,n=t.overflowX,a=t.overflowY;return/auto|scroll|overlay|hidden/.test(r+a+n)}function Kt(e){return["html","body","#document"].indexOf(ie(e))>=0?e.ownerDocument.body:X(e)&&Ot(e)?e:Kt(tt(e))}function Le(e,t){var r;t===void 0&&(t=[]);var n=Kt(e),a=n===((r=e.ownerDocument)==null?void 0:r.body),o=U(n),u=a?[o].concat(o.visualViewport||[],Ot(n)?n:[]):n,c=t.concat(u);return a?c:c.concat(Le(tt(u)))}function pt(e){return Object.assign({},e,{left:e.x,top:e.y,right:e.x+e.width,bottom:e.y+e.height})}function zr(e,t){var r=be(e,!1,t==="fixed");return r.top=r.top+e.clientTop,r.left=r.left+e.clientLeft,r.bottom=r.top+e.clientHeight,r.right=r.left+e.clientWidth,r.width=e.clientWidth,r.height=e.clientHeight,r.x=r.left,r.y=r.top,r}function St(e,t,r){return t===Ft?pt(qr(e,r)):le(t)?zr(t,r):pt(Xr(se(e)))}function Yr(e){var t=Le(tt(e)),r=["absolute","fixed"].indexOf(ae(e).position)>=0,n=r&&X(e)?Pe(e):e;return le(n)?t.filter(function(a){return le(a)&&Xt(a,n)&&ie(a)!=="body"}):[]}function Gr(e,t,r,n){var a=t==="clippingParents"?Yr(e):[].concat(t),o=[].concat(a,[r]),u=o[0],c=o.reduce(function(s,d){var p=St(e,d,n);return s.top=de(p.top,s.top),s.right=Ze(p.right,s.right),s.bottom=Ze(p.bottom,s.bottom),s.left=de(p.left,s.left),s},St(e,u,n));return c.width=c.right-c.left,c.height=c.bottom-c.top,c.x=c.left,c.y=c.top,c}function Jt(e){var t=e.reference,r=e.element,n=e.placement,a=n?ne(n):null,o=n?we(n):null,u=t.x+t.width/2-r.width/2,c=t.y+t.height/2-r.height/2,s;switch(a){case W:s={x:u,y:t.y-r.height};break;case z:s={x:u,y:t.y+t.height};break;case Y:s={x:t.x+t.width,y:c};break;case N:s={x:t.x-r.width,y:c};break;default:s={x:t.x,y:t.y}}var d=a?yt(a):null;if(d!=null){var p=d==="y"?"height":"width";switch(o){case ge:s[d]=s[d]-(t[p]/2-r[p]/2);break;case Re:s[d]=s[d]+(t[p]/2-r[p]/2);break}}return s}function Be(e,t){t===void 0&&(t={});var r=t,n=r.placement,a=n===void 0?e.placement:n,o=r.strategy,u=o===void 0?e.strategy:o,c=r.boundary,s=c===void 0?vr:c,d=r.rootBoundary,p=d===void 0?Ft:d,b=r.elementContext,w=b===void 0?De:b,m=r.altBoundary,x=m===void 0?!1:m,h=r.padding,y=h===void 0?0:h,A=Yt(typeof y!="number"?y:Gt(y,je)),D=w===De?mr:De,S=e.rects.popper,i=e.elements[x?D:w],O=Gr(le(i)?i:i.contextElement||se(e.elements.popper),s,p,u),l=be(e.elements.reference),C=Jt({reference:l,element:S,placement:a}),j=pt(Object.assign({},S,C)),B=w===De?j:l,L={top:O.top-B.top+A.top,bottom:B.bottom-O.bottom+A.bottom,left:O.left-B.left+A.left,right:B.right-O.right+A.right},P=e.modifiersData.offset;if(w===De&&P){var M=P[a];Object.keys(L).forEach(function(R){var F=[Y,z].indexOf(R)>=0?1:-1,_=[W,z].indexOf(R)>=0?"y":"x";L[R]+=M[_]*F})}return L}function Kr(e,t){t===void 0&&(t={});var r=t,n=r.placement,a=r.boundary,o=r.rootBoundary,u=r.padding,c=r.flipVariations,s=r.allowedAutoPlacements,d=s===void 0?Ut:s,p=we(n),b=p?c?Et:Et.filter(function(x){return we(x)===p}):je,w=b.filter(function(x){return d.indexOf(x)>=0});w.length===0&&(w=b);var m=w.reduce(function(x,h){return x[h]=Be(e,{placement:h,boundary:a,rootBoundary:o,padding:u})[ne(h)],x},{});return Object.keys(m).sort(function(x,h){return m[x]-m[h]})}function Jr(e){if(ne(e)===mt)return[];var t=Qe(e);return[Ct(e),t,Ct(t)]}function _r(e){var t=e.state,r=e.options,n=e.name;if(!t.modifiersData[n]._skip){for(var a=r.mainAxis,o=a===void 0?!0:a,u=r.altAxis,c=u===void 0?!0:u,s=r.fallbackPlacements,d=r.padding,p=r.boundary,b=r.rootBoundary,w=r.altBoundary,m=r.flipVariations,x=m===void 0?!0:m,h=r.allowedAutoPlacements,y=t.options.placement,A=ne(y),D=A===y,S=s||(D||!x?[Qe(y)]:Jr(y)),i=[y].concat(S).reduce(function(ee,te){return ee.concat(ne(te)===mt?Kr(t,{placement:te,boundary:p,rootBoundary:b,padding:d,flipVariations:x,allowedAutoPlacements:h}):te)},[]),O=t.rects.reference,l=t.rects.popper,C=new Map,j=!0,B=i[0],L=0;L<i.length;L++){var P=i[L],M=ne(P),R=we(P)===ge,F=[W,z].indexOf(M)>=0,_=F?"width":"height",$=Be(t,{placement:P,boundary:p,rootBoundary:b,altBoundary:w,padding:d}),H=F?R?Y:N:R?z:W;O[_]>l[_]&&(H=Qe(H));var k=Qe(H),Q=[];if(o&&Q.push($[M]<=0),c&&Q.push($[H]<=0,$[k]<=0),Q.every(function(ee){return ee})){B=P,j=!1;break}C.set(P,Q)}if(j)for(var Z=x?3:1,ue=function(te){var ce=i.find(function(pe){var I=C.get(pe);if(I)return I.slice(0,te).every(function(ve){return ve})});if(ce)return B=ce,"break"},oe=Z;oe>0;oe--){var fe=ue(oe);if(fe==="break")break}t.placement!==B&&(t.modifiersData[n]._skip=!0,t.placement=B,t.reset=!0)}}const Qr={name:"flip",enabled:!0,phase:"main",fn:_r,requiresIfExists:["offset"],data:{_skip:!1}};function Lt(e,t,r){return r===void 0&&(r={x:0,y:0}),{top:e.top-t.height-r.y,right:e.right-t.width+r.x,bottom:e.bottom-t.height+r.y,left:e.left-t.width-r.x}}function Mt(e){return[W,Y,z,N].some(function(t){return e[t]>=0})}function Zr(e){var t=e.state,r=e.name,n=t.rects.reference,a=t.rects.popper,o=t.modifiersData.preventOverflow,u=Be(t,{elementContext:"reference"}),c=Be(t,{altBoundary:!0}),s=Lt(u,n),d=Lt(c,a,o),p=Mt(s),b=Mt(d);t.modifiersData[r]={referenceClippingOffsets:s,popperEscapeOffsets:d,isReferenceHidden:p,hasPopperEscaped:b},t.attributes.popper=Object.assign({},t.attributes.popper,{"data-popper-reference-hidden":p,"data-popper-escaped":b})}const en={name:"hide",enabled:!0,phase:"main",requiresIfExists:["preventOverflow"],fn:Zr};function tn(e,t,r){var n=ne(e),a=[N,W].indexOf(n)>=0?-1:1,o=typeof r=="function"?r(Object.assign({},t,{placement:e})):r,u=o[0],c=o[1];return u=u||0,c=(c||0)*a,[N,Y].indexOf(n)>=0?{x:c,y:u}:{x:u,y:c}}function rn(e){var t=e.state,r=e.options,n=e.name,a=r.offset,o=a===void 0?[0,0]:a,u=Ut.reduce(function(p,b){return p[b]=tn(b,t.rects,o),p},{}),c=u[t.placement],s=c.x,d=c.y;t.modifiersData.popperOffsets!=null&&(t.modifiersData.popperOffsets.x+=s,t.modifiersData.popperOffsets.y+=d),t.modifiersData[n]=u}const nn={name:"offset",enabled:!0,phase:"main",requires:["popperOffsets"],fn:rn};function an(e){var t=e.state,r=e.name;t.modifiersData[r]=Jt({reference:t.rects.reference,element:t.rects.popper,placement:t.placement})}const on={name:"popperOffsets",enabled:!0,phase:"read",fn:an,data:{}};function sn(e){return e==="x"?"y":"x"}function un(e){var t=e.state,r=e.options,n=e.name,a=r.mainAxis,o=a===void 0?!0:a,u=r.altAxis,c=u===void 0?!1:u,s=r.boundary,d=r.rootBoundary,p=r.altBoundary,b=r.padding,w=r.tether,m=w===void 0?!0:w,x=r.tetherOffset,h=x===void 0?0:x,y=Be(t,{boundary:s,rootBoundary:d,padding:b,altBoundary:p}),A=ne(t.placement),D=we(t.placement),S=!D,i=yt(A),O=sn(i),l=t.modifiersData.popperOffsets,C=t.rects.reference,j=t.rects.popper,B=typeof h=="function"?h(Object.assign({},t.rects,{placement:t.placement})):h,L=typeof B=="number"?{mainAxis:B,altAxis:B}:Object.assign({mainAxis:0,altAxis:0},B),P=t.modifiersData.offset?t.modifiersData.offset[t.placement]:null,M={x:0,y:0};if(l){if(o){var R,F=i==="y"?W:N,_=i==="y"?z:Y,$=i==="y"?"height":"width",H=l[i],k=H+y[F],Q=H-y[_],Z=m?-j[$]/2:0,ue=D===ge?C[$]:j[$],oe=D===ge?-j[$]:-C[$],fe=t.elements.arrow,ee=m&&fe?gt(fe):{width:0,height:0},te=t.modifiersData["arrow#persistent"]?t.modifiersData["arrow#persistent"].padding:zt(),ce=te[F],pe=te[_],I=Se(0,C[$],ee[$]),ve=S?C[$]/2-Z-I-ce-L.mainAxis:ue-I-ce-L.mainAxis,Ve=S?-C[$]/2+Z+I+pe+L.mainAxis:oe+I+pe+L.mainAxis,me=t.elements.arrow&&Pe(t.elements.arrow),ke=me?i==="y"?me.clientTop||0:me.clientLeft||0:0,Oe=(R=P==null?void 0:P[i])!=null?R:0,He=H+ve-Oe-ke,Ie=H+Ve-Oe,xe=Se(m?Ze(k,He):k,H,m?de(Q,Ie):Q);l[i]=xe,M[i]=xe-H}if(c){var Ae,nt=i==="x"?W:N,Ee=i==="x"?z:Y,G=l[O],K=O==="y"?"height":"width",We=G+y[nt],Ne=G-y[Ee],Te=[W,N].indexOf(A)!==-1,Fe=(Ae=P==null?void 0:P[O])!=null?Ae:0,Ue=Te?We:G-C[K]-j[K]-Fe+L.altAxis,qe=Te?G+C[K]+j[K]-Fe-L.altAxis:Ne,Xe=m&&Te?Rr(Ue,G,qe):Se(m?Ue:We,G,m?qe:Ne);l[O]=Xe,M[O]=Xe-G}t.modifiersData[n]=M}}const fn={name:"preventOverflow",enabled:!0,phase:"main",fn:un,requiresIfExists:["offset"]};function cn(e){return{scrollLeft:e.scrollLeft,scrollTop:e.scrollTop}}function pn(e){return e===U(e)||!X(e)?bt(e):cn(e)}function dn(e){var t=e.getBoundingClientRect(),r=ye(t.width)/e.offsetWidth||1,n=ye(t.height)/e.offsetHeight||1;return r!==1||n!==1}function ln(e,t,r){r===void 0&&(r=!1);var n=X(t),a=X(t)&&dn(t),o=se(t),u=be(e,a,r),c={scrollLeft:0,scrollTop:0},s={x:0,y:0};return(n||!n&&!r)&&((ie(t)!=="body"||Ot(o))&&(c=pn(t)),X(t)?(s=be(t,!0),s.x+=t.clientLeft,s.y+=t.clientTop):o&&(s.x=wt(o))),{x:u.left+c.scrollLeft-s.x,y:u.top+c.scrollTop-s.y,width:u.width,height:u.height}}function vn(e){var t=new Map,r=new Set,n=[];e.forEach(function(o){t.set(o.name,o)});function a(o){r.add(o.name);var u=[].concat(o.requires||[],o.requiresIfExists||[]);u.forEach(function(c){if(!r.has(c)){var s=t.get(c);s&&a(s)}}),n.push(o)}return e.forEach(function(o){r.has(o.name)||a(o)}),n}function mn(e){var t=vn(e);return Tr.reduce(function(r,n){return r.concat(t.filter(function(a){return a.phase===n}))},[])}function hn(e){var t;return function(){return t||(t=new Promise(function(r){Promise.resolve().then(function(){t=void 0,r(e())})})),t}}function gn(e){var t=e.reduce(function(r,n){var a=r[n.name];return r[n.name]=a?Object.assign({},a,n,{options:Object.assign({},a.options,n.options),data:Object.assign({},a.data,n.data)}):n,r},{});return Object.keys(t).map(function(r){return t[r]})}var Rt={placement:"bottom",modifiers:[],strategy:"absolute"};function Bt(){for(var e=arguments.length,t=new Array(e),r=0;r<e;r++)t[r]=arguments[r];return!t.some(function(n){return!(n&&typeof n.getBoundingClientRect=="function")})}function yn(e){e===void 0&&(e={});var t=e,r=t.defaultModifiers,n=r===void 0?[]:r,a=t.defaultOptions,o=a===void 0?Rt:a;return function(c,s,d){d===void 0&&(d=o);var p={placement:"bottom",orderedModifiers:[],options:Object.assign({},Rt,o),modifiersData:{},elements:{reference:c,popper:s},attributes:{},styles:{}},b=[],w=!1,m={state:p,setOptions:function(A){var D=typeof A=="function"?A(p.options):A;h(),p.options=Object.assign({},o,p.options,D),p.scrollParents={reference:le(c)?Le(c):c.contextElement?Le(c.contextElement):[],popper:Le(s)};var S=mn(gn([].concat(n,p.options.modifiers)));return p.orderedModifiers=S.filter(function(i){return i.enabled}),x(),m.update()},forceUpdate:function(){if(!w){var A=p.elements,D=A.reference,S=A.popper;if(Bt(D,S)){p.rects={reference:ln(D,Pe(S),p.options.strategy==="fixed"),popper:gt(S)},p.reset=!1,p.placement=p.options.placement,p.orderedModifiers.forEach(function(L){return p.modifiersData[L.name]=Object.assign({},L.data)});for(var i=0;i<p.orderedModifiers.length;i++){if(p.reset===!0){p.reset=!1,i=-1;continue}var O=p.orderedModifiers[i],l=O.fn,C=O.options,j=C===void 0?{}:C,B=O.name;typeof l=="function"&&(p=l({state:p,options:j,name:B,instance:m})||p)}}}},update:hn(function(){return new Promise(function(y){m.forceUpdate(),y(p)})}),destroy:function(){h(),w=!0}};if(!Bt(c,s))return m;m.setOptions(d).then(function(y){!w&&d.onFirstUpdate&&d.onFirstUpdate(y)});function x(){p.orderedModifiers.forEach(function(y){var A=y.name,D=y.options,S=D===void 0?{}:D,i=y.effect;if(typeof i=="function"){var O=i({state:p,name:A,instance:m,options:S}),l=function(){};b.push(O||l)}})}function h(){b.forEach(function(y){return y()}),b=[]}return m}}var bn=[Nr,on,Ir,Sr,nn,Qr,fn,$r,en],wn=yn({defaultModifiers:bn}),dt={passive:!0},On="tippy-iOS",xn="tippy-box",_t="tippy-content",An="tippy-backdrop",Qt="tippy-arrow",Zt="tippy-svg-arrow";function st(e,t,r){if(Array.isArray(e)){var n=e[t];return n??(Array.isArray(r)?r[t]:r)}return e}function xt(e,t){var r={}.toString.call(e);return r.indexOf("[object")===0&&r.indexOf(t+"]")>-1}function er(e,t){return typeof e=="function"?e.apply(void 0,t):e}function jt(e,t){if(t===0)return e;var r;return function(n){clearTimeout(r),r=setTimeout(function(){e(n)},t)}}function En(e){return e.split(/\s+/).filter(Boolean)}function Ce(e){return[].concat(e)}function Pt(e,t){e.indexOf(t)===-1&&e.push(t)}function Tn(e){return e.filter(function(t,r){return e.indexOf(t)===r})}function Dn(e){return e.split("-")[0]}function et(e){return[].slice.call(e)}function Me(){return document.createElement("div")}function rt(e){return xt(e,"Element")}function Cn(e){return xt(e,"NodeList")}function Sn(e){return xt(e,"MouseEvent")}function Ln(e){return!!(e&&e._tippy&&e._tippy.reference===e)}function Mn(e){return rt(e)?[e]:Cn(e)?et(e):Array.isArray(e)?e:et(document.querySelectorAll(e))}function ut(e,t){e.forEach(function(r){r&&(r.style.transitionDuration=t+"ms")})}function $t(e,t){e.forEach(function(r){r&&r.setAttribute("data-state",t)})}function Rn(e){var t=Ce(e),r=t[0];return r&&r.ownerDocument||document}function Bn(e,t){var r=t.clientX,n=t.clientY;return e.every(function(a){var o=a.popperRect,u=a.popperState,c=a.props,s=c.interactiveBorder,d=Dn(u.placement),p=u.modifiersData.offset;if(!p)return!0;var b=d==="bottom"?p.top.y:0,w=d==="top"?p.bottom.y:0,m=d==="right"?p.left.x:0,x=d==="left"?p.right.x:0,h=o.top-n+b>s,y=n-o.bottom-w>s,A=o.left-r+m>s,D=r-o.right-x>s;return h||y||A||D})}function ft(e,t,r){var n=t+"EventListener";["transitionend","webkitTransitionEnd"].forEach(function(a){e[n](a,r)})}var re={isTouch:!1},Vt=0;function jn(){re.isTouch||(re.isTouch=!0,window.performance&&document.addEventListener("mousemove",tr))}function tr(){var e=performance.now();e-Vt<20&&(re.isTouch=!1,document.removeEventListener("mousemove",tr)),Vt=e}function Pn(){var e=document.activeElement;if(Ln(e)){var t=e._tippy;e.blur&&!t.state.isVisible&&e.blur()}}function $n(){document.addEventListener("touchstart",jn,Object.assign({},dt,{capture:!0})),window.addEventListener("blur",Pn)}var rr=typeof window<"u"&&typeof document<"u",Vn=rr?navigator.userAgent:"",kn=/MSIE |Trident\//.test(Vn),Hn=rr&&/iPhone|iPad|iPod/.test(navigator.platform),In={animateFill:!1,followCursor:!1,inlinePositioning:!1,sticky:!1},Wn={allowHTML:!1,animation:"fade",arrow:!0,content:"",inertia:!1,maxWidth:350,role:"tooltip",theme:"",zIndex:9999},J=Object.assign({appendTo:function(){return document.body},aria:{content:"auto",expanded:"auto"},content:"",delay:0,duration:[300,250],getReferenceClientRect:null,hideOnClick:!0,ignoreAttributes:!1,interactive:!1,interactiveBorder:2,interactiveDebounce:0,moveTransition:"",offset:[0,10],onAfterUpdate:function(){},onBeforeUpdate:function(){},onCreate:function(){},onDestroy:function(){},onHidden:function(){},onHide:function(){},onMount:function(){},onShow:function(){},onShown:function(){},onTrigger:function(){},onUntrigger:function(){},placement:"top",plugins:[],popperOptions:{},render:null,showOnCreate:!1,touch:!0,trigger:"mouseenter focus",triggerTarget:null},In,{},Wn),Nn=Object.keys(J),Fn=function(t){var r=Object.keys(t);r.forEach(function(n){J[n]=t[n]})};function nr(e){var t=e.plugins||[],r=t.reduce(function(n,a){var o=a.name,u=a.defaultValue;return o&&(n[o]=e[o]!==void 0?e[o]:u),n},{});return Object.assign({},e,{},r)}function Un(e,t){var r=t?Object.keys(nr(Object.assign({},J,{plugins:t}))):Nn,n=r.reduce(function(a,o){var u=(e.getAttribute("data-tippy-"+o)||"").trim();if(!u)return a;if(o==="content")a[o]=u;else try{a[o]=JSON.parse(u)}catch{a[o]=u}return a},{});return n}function kt(e,t){var r=Object.assign({},t,{content:er(t.content,[e])},t.ignoreAttributes?{}:Un(e,t.plugins));return r.aria=Object.assign({},J.aria,{},r.aria),r.aria={expanded:r.aria.expanded==="auto"?t.interactive:r.aria.expanded,content:r.aria.content==="auto"?t.interactive?null:"describedby":r.aria.content},r}var qn=function(){return"innerHTML"};function lt(e,t){e[qn()]=t}function Ht(e){var t=Me();return e===!0?t.className=Qt:(t.className=Zt,rt(e)?t.appendChild(e):lt(t,e)),t}function It(e,t){rt(t.content)?(lt(e,""),e.appendChild(t.content)):typeof t.content!="function"&&(t.allowHTML?lt(e,t.content):e.textContent=t.content)}function vt(e){var t=e.firstElementChild,r=et(t.children);return{box:t,content:r.find(function(n){return n.classList.contains(_t)}),arrow:r.find(function(n){return n.classList.contains(Qt)||n.classList.contains(Zt)}),backdrop:r.find(function(n){return n.classList.contains(An)})}}function ir(e){var t=Me(),r=Me();r.className=xn,r.setAttribute("data-state","hidden"),r.setAttribute("tabindex","-1");var n=Me();n.className=_t,n.setAttribute("data-state","hidden"),It(n,e.props),t.appendChild(r),r.appendChild(n),a(e.props,e.props);function a(o,u){var c=vt(t),s=c.box,d=c.content,p=c.arrow;u.theme?s.setAttribute("data-theme",u.theme):s.removeAttribute("data-theme"),typeof u.animation=="string"?s.setAttribute("data-animation",u.animation):s.removeAttribute("data-animation"),u.inertia?s.setAttribute("data-inertia",""):s.removeAttribute("data-inertia"),s.style.maxWidth=typeof u.maxWidth=="number"?u.maxWidth+"px":u.maxWidth,u.role?s.setAttribute("role",u.role):s.removeAttribute("role"),o.content!==u.content&&It(d,e.props),u.arrow?p?o.arrow!==u.arrow&&(s.removeChild(p),s.appendChild(Ht(u.arrow))):s.appendChild(Ht(u.arrow)):p&&s.removeChild(p)}return{popper:t,onUpdate:a}}ir.$$tippy=!0;var Xn=1,Je=[],_e=[];function zn(e,t){var r=kt(e,Object.assign({},J,{},nr(t))),n,a,o,u=!1,c=!1,s=!1,d,p,b,w=[],m=jt(ke,r.interactiveDebounce),x,h=Rn(r.triggerTarget||e),y=Xn++,A=null,D=Tn(r.plugins),S={isEnabled:!0,isVisible:!1,isDestroyed:!1,isMounted:!1,isShown:!1},i={id:y,reference:e,popper:Me(),popperInstance:A,props:r,state:S,plugins:D,clearDelayTimeouts:Te,setProps:Fe,setContent:Ue,show:qe,hide:Xe,enable:We,disable:Ne,unmount:ar,destroy:or};if(!r.render)return i;var O=r.render(i),l=O.popper,C=O.onUpdate;l.setAttribute("data-tippy-root",""),l.id="tippy-"+i.id,i.popper=l,e._tippy=i,l._tippy=i;var j=D.map(function(f){return f.fn(i)}),B=e.hasAttribute("aria-expanded");return ve(),Z(),$(),k("onCreate",[i]),r.showOnCreate&&G(),l.addEventListener("mouseenter",function(){i.props.interactive&&i.state.isVisible&&i.clearDelayTimeouts()}),l.addEventListener("mouseleave",function(f){i.props.interactive&&i.props.trigger.indexOf("mouseenter")>=0&&(h.addEventListener("mousemove",m),m(f))}),i;function L(){var f=i.props.touch;return Array.isArray(f)?f:[f,0]}function P(){return L()[0]==="hold"}function M(){var f;return!!((f=i.props.render)!=null&&f.$$tippy)}function R(){return x||e}function F(){return vt(l)}function _(f){return i.state.isMounted&&!i.state.isVisible||re.isTouch||d&&d.type==="focus"?0:st(i.props.delay,f?0:1,J.delay)}function $(){l.style.pointerEvents=i.props.interactive&&i.state.isVisible?"":"none",l.style.zIndex=""+i.props.zIndex}function H(f){var v=f&&Hn&&re.isTouch;h.body.classList[v?"add":"remove"](On)}function k(f,v,g){if(g===void 0&&(g=!0),j.forEach(function(E){E[f]&&E[f].apply(void 0,v)}),g){var T;(T=i.props)[f].apply(T,v)}}function Q(){var f=i.props.aria;if(f.content){var v="aria-"+f.content,g=l.id,T=Ce(i.props.triggerTarget||e);T.forEach(function(E){var V=E.getAttribute(v);if(i.state.isVisible)E.setAttribute(v,V?V+" "+g:g);else{var q=V&&V.replace(g,"").trim();q?E.setAttribute(v,q):E.removeAttribute(v)}})}}function Z(){if(!(B||!i.props.aria.expanded)){var f=Ce(i.props.triggerTarget||e);f.forEach(function(v){i.props.interactive?v.setAttribute("aria-expanded",i.state.isVisible&&v===R()?"true":"false"):v.removeAttribute("aria-expanded")})}}function ue(){h.body.removeEventListener("mouseleave",K),h.removeEventListener("mousemove",m),Je=Je.filter(function(f){return f!==m})}function oe(f){i.props.interactive&&l.contains(f.target)||R().contains(f.target)&&(re.isTouch||i.state.isVisible&&i.props.trigger.indexOf("click")>=0)||i.props.hideOnClick===!0&&(u=!1,i.clearDelayTimeouts(),i.hide(),c=!0,setTimeout(function(){c=!1}),i.state.isMounted||ee())}function fe(){h.addEventListener("mousedown",oe,!0)}function ee(){h.removeEventListener("mousedown",oe,!0)}function te(f,v){pe(f,function(){!i.state.isVisible&&l.parentNode&&l.parentNode.contains(l)&&v()})}function ce(f,v){pe(f,v)}function pe(f,v){var g=F().box;function T(E){E.target===g&&(ft(g,"remove",T),v())}if(f===0)return v();ft(g,"remove",p),ft(g,"add",T),p=T}function I(f,v,g){g===void 0&&(g=!1);var T=Ce(i.props.triggerTarget||e);T.forEach(function(E){E.addEventListener(f,v,g),w.push({node:E,eventType:f,handler:v,options:g})})}function ve(){P()&&(I("touchstart",me,dt),I("touchend",Oe,dt)),En(i.props.trigger).forEach(function(f){if(f!=="manual")switch(I(f,me),f){case"mouseenter":I("mouseleave",Oe);break;case"focus":I(kn?"focusout":"blur",He);break;case"focusin":I("focusout",He);break}})}function Ve(){w.forEach(function(f){var v=f.node,g=f.eventType,T=f.handler,E=f.options;v.removeEventListener(g,T,E)}),w=[]}function me(f){var v=!1;if(!(!i.state.isEnabled||Ie(f)||c)){if(d=f,x=f.currentTarget,Z(),!i.state.isVisible&&Sn(f)&&Je.forEach(function(V){return V(f)}),f.type==="click"&&(i.props.trigger.indexOf("mouseenter")<0||u)&&i.props.hideOnClick!==!1&&i.state.isVisible)v=!0;else{var g=L(),T=g[0],E=g[1];re.isTouch&&T==="hold"&&E?n=setTimeout(function(){G(f)},E):G(f)}f.type==="click"&&(u=!v),v&&K(f)}}function ke(f){var v=f.target,g=e.contains(v)||l.contains(v);if(!(f.type==="mousemove"&&g)){var T=Ee().concat(l).map(function(E){var V,q=E._tippy,he=(V=q.popperInstance)==null?void 0:V.state;return he?{popperRect:E.getBoundingClientRect(),popperState:he,props:r}:null}).filter(Boolean);Bn(T,f)&&(ue(),K(f))}}function Oe(f){var v=Ie(f)||i.props.trigger.indexOf("click")>=0&&u;if(!v){if(i.props.interactive){h.body.addEventListener("mouseleave",K),h.addEventListener("mousemove",m),Pt(Je,m),m(f);return}K(f)}}function He(f){i.props.trigger.indexOf("focusin")<0&&f.target!==R()||i.props.interactive&&f.relatedTarget&&l.contains(f.relatedTarget)||K(f)}function Ie(f){return re.isTouch?P()!==f.type.indexOf("touch")>=0:!1}function xe(){Ae();var f=i.props,v=f.popperOptions,g=f.placement,T=f.offset,E=f.getReferenceClientRect,V=f.moveTransition,q=M()?vt(l).arrow:null,he=E?{getBoundingClientRect:E}:e,At={name:"$$tippy",enabled:!0,phase:"beforeWrite",requires:["computeStyles"],fn:function(sr){var at=sr.state;if(M()){var ur=F(),ot=ur.box;["placement","reference-hidden","escaped"].forEach(function(Ge){Ge==="placement"?ot.setAttribute("data-placement",at.placement):at.attributes.popper["data-popper-"+Ge]?ot.setAttribute("data-"+Ge,""):ot.removeAttribute("data-"+Ge)}),at.attributes.popper={}}}},ze={name:"arrow",enabled:!!q,options:{element:q,padding:3}},Ye=[{name:"offset",options:{offset:T}},{name:"preventOverflow",options:{padding:{top:2,bottom:2,left:5,right:5}}},{name:"flip",options:{padding:5}},{name:"computeStyles",options:{adaptive:!V}}].concat(M()?[ze]:[],(v==null?void 0:v.modifiers)||[],[At]);i.popperInstance=wn(he,l,Object.assign({},v,{placement:g,onFirstUpdate:b,modifiers:Ye}))}function Ae(){i.popperInstance&&(i.popperInstance.destroy(),i.popperInstance=null)}function nt(){var f=i.props.appendTo,v,g=R();i.props.interactive&&f===J.appendTo||f==="parent"?v=g.parentNode:v=er(f,[g]),v.contains(l)||v.appendChild(l),xe()}function Ee(){return et(l.querySelectorAll("[data-tippy-root]"))}function G(f){i.clearDelayTimeouts(),f&&k("onTrigger",[i,f]),fe();var v=_(!0);v?n=setTimeout(function(){i.show()},v):i.show()}function K(f){if(i.clearDelayTimeouts(),k("onUntrigger",[i,f]),!i.state.isVisible){ee();return}if(!(i.props.trigger.indexOf("mouseenter")>=0&&i.props.trigger.indexOf("click")>=0&&["mouseleave","mousemove"].indexOf(f.type)>=0&&u)){var v=_(!1);v?a=setTimeout(function(){i.state.isVisible&&i.hide()},v):o=requestAnimationFrame(function(){i.hide()})}}function We(){i.state.isEnabled=!0}function Ne(){i.hide(),i.state.isEnabled=!1}function Te(){clearTimeout(n),clearTimeout(a),cancelAnimationFrame(o)}function Fe(f){if(!i.state.isDestroyed){k("onBeforeUpdate",[i,f]),Ve();var v=i.props,g=kt(e,Object.assign({},i.props,{},f,{ignoreAttributes:!0}));i.props=g,ve(),v.interactiveDebounce!==g.interactiveDebounce&&(ue(),m=jt(ke,g.interactiveDebounce)),v.triggerTarget&&!g.triggerTarget?Ce(v.triggerTarget).forEach(function(T){T.removeAttribute("aria-expanded")}):g.triggerTarget&&e.removeAttribute("aria-expanded"),Z(),$(),C&&C(v,g),i.popperInstance&&(xe(),Ee().forEach(function(T){requestAnimationFrame(T._tippy.popperInstance.forceUpdate)})),k("onAfterUpdate",[i,f])}}function Ue(f){i.setProps({content:f})}function qe(){var f=i.state.isVisible,v=i.state.isDestroyed,g=!i.state.isEnabled,T=re.isTouch&&!i.props.touch,E=st(i.props.duration,0,J.duration);if(!(f||v||g||T)&&!R().hasAttribute("disabled")&&(k("onShow",[i],!1),i.props.onShow(i)!==!1)){if(i.state.isVisible=!0,M()&&(l.style.visibility="visible"),$(),fe(),i.state.isMounted||(l.style.transition="none"),M()){var V=F(),q=V.box,he=V.content;ut([q,he],0)}b=function(){if(!(!i.state.isVisible||s)){if(s=!0,l.offsetHeight,l.style.transition=i.props.moveTransition,M()&&i.props.animation){var ze=F(),Ye=ze.box,it=ze.content;ut([Ye,it],E),$t([Ye,it],"visible")}Q(),Z(),Pt(_e,i),H(!0),i.state.isMounted=!0,k("onMount",[i]),i.props.animation&&M()&&ce(E,function(){i.state.isShown=!0,k("onShown",[i])})}},nt()}}function Xe(){var f=!i.state.isVisible,v=i.state.isDestroyed,g=!i.state.isEnabled,T=st(i.props.duration,1,J.duration);if(!(f||v||g)&&(k("onHide",[i],!1),i.props.onHide(i)!==!1)){if(i.state.isVisible=!1,i.state.isShown=!1,s=!1,M()&&(l.style.visibility="hidden"),ue(),ee(),$(),M()){var E=F(),V=E.box,q=E.content;i.props.animation&&(ut([V,q],T),$t([V,q],"hidden"))}Q(),Z(),i.props.animation?M()&&te(T,i.unmount):i.unmount()}}function ar(){i.state.isVisible&&i.hide(),i.state.isMounted&&(Ae(),Ee().forEach(function(f){f._tippy.unmount()}),l.parentNode&&l.parentNode.removeChild(l),_e=_e.filter(function(f){return f!==i}),_e.length===0&&H(!1),i.state.isMounted=!1,k("onHidden",[i]))}function or(){i.state.isDestroyed||(i.clearDelayTimeouts(),i.unmount(),Ve(),delete e._tippy,i.state.isDestroyed=!0,k("onDestroy",[i]))}}function $e(e,t){t===void 0&&(t={});var r=J.plugins.concat(t.plugins||[]);$n();var n=Object.assign({},t,{plugins:r}),a=Mn(e),o=a.reduce(function(u,c){var s=c&&zn(c,n);return s&&u.push(s),u},[]);return rt(e)?o[0]:o}$e.defaultProps=J;$e.setDefaultProps=Fn;$e.currentInput=re;$e.setDefaultProps({render:ir});function Wt(e,t){$e(e,t)}function Nt(e){let t="",r=50;if(!e)return{content:"",delay:[r,0]};if(typeof e=="string")t=e;else if(Array.isArray(e))[t,r]=e;else return{content:"",delay:[r,0],...e};return{content:t,delay:[r,0]}}function Kn(e,t){var n;const r=Nt(t);return Wt(e,r),r.content.length<=0&&((n=e._tippy)==null||n.destroy()),{update(a){var u,c;const o=Nt(a);e._tippy||Wt(e,o),o.content.length<=0&&((u=e._tippy)==null||u.destroy()),(c=e._tippy)==null||c.setProps(o)},destroy(){var a;(a=e._tippy)==null||a.destroy()}}}export{Gn as a,Kn as t};
