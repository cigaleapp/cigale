import{M as ee,e as ae,N as W,K as S,h as C,O as re,d as ne,g as B,P as fe,I as ie,J,L as D,j as w,Q as le,y as Z,i as $,p as se,R as b,T as z,q as ue,V as K,W as k,m as P,X as y,o as te,n as Q,Y as ve,Z as de,_ as _e,$ as oe,a0 as ce,a1 as he,a2 as Ee,a3 as pe}from"./B4FbSzIj.js";function xe(l,e){return e}function Te(l,e,a,u){for(var v=[],_=e.length,t=0;t<_;t++)_e(e[t].e,v,!0);var o=_>0&&v.length===0&&a!==null;if(o){var T=a.parentNode;oe(T),T.append(a),u.clear(),x(l,e[0].prev,e[_-1].next)}ce(v,()=>{for(var h=0;h<_;h++){var d=e[h];o||(u.delete(d.k),x(l,d.prev,d.next)),he(d.e,!o)}})}function Ce(l,e,a,u,v,_=null){var t=l,o={items:new Map,first:null},T=(e&W)!==0;if(T){var h=l;t=C?S(re(h)):h.appendChild(ee())}C&&ne();var d=null,N=!1,f=fe(()=>{var s=a();return ve(s)?s:s==null?[]:z(s)});ae(()=>{var s=B(f),r=s.length;if(N&&r===0)return;N=r===0;let I=!1;if(C){var E=t.data===ie;E!==(r===0)&&(t=J(),S(t),D(!1),I=!0)}if(C){for(var p=null,A,c=0;c<r;c++){if(w.nodeType===8&&w.data===le){t=w,I=!0,D(!1);break}var n=s[c],i=u(n,c);A=F(w,o,p,null,n,i,c,v,e,a),o.items.set(i,A),p=A}r>0&&S(J())}C||Ae(s,o,t,v,e,u,a),_!==null&&(r===0?d?Z(d):d=$(()=>_(t)):d!==null&&se(d,()=>{d=null})),I&&D(!0),B(f)}),C&&(t=w)}function Ae(l,e,a,u,v,_,t){var O,q,V,Y;var o=(v&de)!==0,T=(v&(k|y))!==0,h=l.length,d=e.items,N=e.first,f=N,s,r=null,I,E=[],p=[],A,c,n,i;if(o)for(i=0;i<h;i+=1)A=l[i],c=_(A,i),n=d.get(c),n!==void 0&&((O=n.a)==null||O.measure(),(I??(I=new Set)).add(n));for(i=0;i<h;i+=1){if(A=l[i],c=_(A,i),n=d.get(c),n===void 0){var G=f?f.e.nodes_start:a;r=F(G,e,r,r===null?e.first:r.next,A,c,i,u,v,t),d.set(c,r),E=[],p=[],f=r.next;continue}if(T&&Ie(n,A,i,v),(n.e.f&b)!==0&&(Z(n.e),o&&((q=n.a)==null||q.unfix(),(I??(I=new Set)).delete(n))),n!==f){if(s!==void 0&&s.has(n)){if(E.length<p.length){var R=p[0],m;r=R.prev;var L=E[0],H=E[E.length-1];for(m=0;m<E.length;m+=1)U(E[m],R,a);for(m=0;m<p.length;m+=1)s.delete(p[m]);x(e,L.prev,H.next),x(e,r,L),x(e,H,R),f=R,r=H,i-=1,E=[],p=[]}else s.delete(n),U(n,f,a),x(e,n.prev,n.next),x(e,n,r===null?e.first:r.next),x(e,r,n),r=n;continue}for(E=[],p=[];f!==null&&f.k!==c;)(f.e.f&b)===0&&(s??(s=new Set)).add(f),p.push(f),f=f.next;if(f===null)continue;n=f}E.push(n),r=n,f=n.next}if(f!==null||s!==void 0){for(var g=s===void 0?[]:z(s);f!==null;)(f.e.f&b)===0&&g.push(f),f=f.next;var M=g.length;if(M>0){var j=(v&W)!==0&&h===0?a:null;if(o){for(i=0;i<M;i+=1)(V=g[i].a)==null||V.measure();for(i=0;i<M;i+=1)(Y=g[i].a)==null||Y.fix()}Te(e,g,j,d)}}o&&ue(()=>{var X;if(I!==void 0)for(n of I)(X=n.a)==null||X.apply()}),K.first=e.first&&e.first.e,K.last=r&&r.e}function Ie(l,e,a,u){(u&k)!==0&&P(l.v,e),(u&y)!==0?P(l.i,a):l.i=a}function F(l,e,a,u,v,_,t,o,T,h){var d=(T&k)!==0,N=(T&Ee)===0,f=d?N?te(v):Q(v):v,s=(T&y)===0?t:Q(t),r={i:s,v:f,k:_,a:null,e:null,prev:a,next:u};try{return r.e=$(()=>o(l,f,s,h),C),r.e.prev=a&&a.e,r.e.next=u&&u.e,a===null?e.first=r:(a.next=r,a.e.next=r.e),u!==null&&(u.prev=r,u.e.prev=r.e),r}finally{}}function U(l,e,a){for(var u=l.next?l.next.e.nodes_start:a,v=e?e.e.nodes_start:a,_=l.e.nodes_start;_!==u;){var t=pe(_);v.before(_),_=t}}function x(l,e,a){e===null?l.first=a:(e.next=a,e.e.next=a&&a.e),a!==null&&(a.prev=e,a.e.prev=e&&e.e)}export{Ce as e,xe as i};
