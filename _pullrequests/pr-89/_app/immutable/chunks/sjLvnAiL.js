import{P as ee,e as ae,Q as $,C as S,h as C,R as re,d as ne,g as X,T as fe,A as ie,B as P,D as M,j as N,V as le,y as z,i as F,p as se,W as b,X as G,q as ue,Y as Q,Z as k,m as U,_ as y,o as te,n as W,$ as ve,a0 as de,a1 as _e,a2 as oe,a3 as ce,a4 as he,a5 as Ee,a6 as pe}from"./C5da3JO5.js";function xe(l,e){return e}function Ae(l,e,a,u){for(var v=[],_=e.length,t=0;t<_;t++)_e(e[t].e,v,!0);var o=_>0&&v.length===0&&a!==null;if(o){var A=a.parentNode;oe(A),A.append(a),u.clear(),x(l,e[0].prev,e[_-1].next)}ce(v,()=>{for(var h=0;h<_;h++){var d=e[h];o||(u.delete(d.k),x(l,d.prev,d.next)),he(d.e,!o)}})}function Ce(l,e,a,u,v,_=null){var t=l,o={items:new Map,first:null},A=(e&$)!==0;if(A){var h=l;t=C?S(re(h)):h.appendChild(ee())}C&&ne();var d=null,g=!1,f=fe(()=>{var s=a();return ve(s)?s:s==null?[]:G(s)});ae(()=>{var s=X(f),r=s.length;if(g&&r===0)return;g=r===0;let I=!1;if(C){var E=t.data===ie;E!==(r===0)&&(t=P(),S(t),M(!1),I=!0)}if(C){for(var p=null,T,c=0;c<r;c++){if(N.nodeType===8&&N.data===le){t=N,I=!0,M(!1);break}var n=s[c],i=u(n,c);T=J(N,o,p,null,n,i,c,v,e,a),o.items.set(i,T),p=T}r>0&&S(P())}C||Te(s,o,t,v,e,u,a),_!==null&&(r===0?d?z(d):d=F(()=>_(t)):d!==null&&se(d,()=>{d=null})),I&&M(!0),X(f)}),C&&(t=N)}function Te(l,e,a,u,v,_,t){var O,q,V,Y;var o=(v&de)!==0,A=(v&(k|y))!==0,h=l.length,d=e.items,g=e.first,f=g,s,r=null,I,E=[],p=[],T,c,n,i;if(o)for(i=0;i<h;i+=1)T=l[i],c=_(T,i),n=d.get(c),n!==void 0&&((O=n.a)==null||O.measure(),(I??(I=new Set)).add(n));for(i=0;i<h;i+=1){if(T=l[i],c=_(T,i),n=d.get(c),n===void 0){var K=f?f.e.nodes_start:a;r=J(K,e,r,r===null?e.first:r.next,T,c,i,u,v,t),d.set(c,r),E=[],p=[],f=r.next;continue}if(A&&Ie(n,T,i,v),(n.e.f&b)!==0&&(z(n.e),o&&((q=n.a)==null||q.unfix(),(I??(I=new Set)).delete(n))),n!==f){if(s!==void 0&&s.has(n)){if(E.length<p.length){var R=p[0],m;r=R.prev;var L=E[0],D=E[E.length-1];for(m=0;m<E.length;m+=1)Z(E[m],R,a);for(m=0;m<p.length;m+=1)s.delete(p[m]);x(e,L.prev,D.next),x(e,r,L),x(e,D,R),f=R,r=D,i-=1,E=[],p=[]}else s.delete(n),Z(n,f,a),x(e,n.prev,n.next),x(e,n,r===null?e.first:r.next),x(e,r,n),r=n;continue}for(E=[],p=[];f!==null&&f.k!==c;)(f.e.f&b)===0&&(s??(s=new Set)).add(f),p.push(f),f=f.next;if(f===null)continue;n=f}E.push(n),r=n,f=n.next}if(f!==null||s!==void 0){for(var w=s===void 0?[]:G(s);f!==null;)(f.e.f&b)===0&&w.push(f),f=f.next;var H=w.length;if(H>0){var j=(v&$)!==0&&h===0?a:null;if(o){for(i=0;i<H;i+=1)(V=w[i].a)==null||V.measure();for(i=0;i<H;i+=1)(Y=w[i].a)==null||Y.fix()}Ae(e,w,j,d)}}o&&ue(()=>{var B;if(I!==void 0)for(n of I)(B=n.a)==null||B.apply()}),Q.first=e.first&&e.first.e,Q.last=r&&r.e}function Ie(l,e,a,u){(u&k)!==0&&U(l.v,e),(u&y)!==0?U(l.i,a):l.i=a}function J(l,e,a,u,v,_,t,o,A,h){var d=(A&k)!==0,g=(A&Ee)===0,f=d?g?te(v):W(v):v,s=(A&y)===0?t:W(t),r={i:s,v:f,k:_,a:null,e:null,prev:a,next:u};try{return r.e=F(()=>o(l,f,s,h),C),r.e.prev=a&&a.e,r.e.next=u&&u.e,a===null?e.first=r:(a.next=r,a.e.next=r.e),u!==null&&(u.prev=r,u.e.prev=r.e),r}finally{}}function Z(l,e,a){for(var u=l.next?l.next.e.nodes_start:a,v=e?e.e.nodes_start:a,_=l.e.nodes_start;_!==u;){var t=pe(_);v.before(_),_=t}}function x(l,e,a){e===null?l.first=a:(e.next=a,e.e.next=a&&a.e),a!==null&&(a.prev=e,a.e.prev=e&&e.e)}export{Ce as e,xe as i};
