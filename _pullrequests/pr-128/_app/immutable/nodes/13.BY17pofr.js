import{t as X,a as k,c as re}from"../chunks/Dg_JGDnQ.js";import"../chunks/BjuUFwti.js";import{b as i,g as t,n as oe,ac as ne,a as c,f as F,t as G,o as g,ad as le,c as y,r as m,av as J}from"../chunks/ypqVbSJJ.js";import{e as pe,s as q}from"../chunks/BtM3C0Ax.js";import{e as K,i as N}from"../chunks/Cd1247F3.js";import{a as ce}from"../chunks/DGulLCEo.js";import{d as ge}from"../chunks/B9rrBtvN.js";import{b as Q}from"../chunks/BjcWHYSf.js";import{i as me}from"../chunks/CAa5nETK.js";import{d as fe,l as V,e as de,f as ue,c as ve,g as he,t as _e}from"../chunks/B_sPhGd8.js";import{u as we}from"../chunks/_O9FJD8M.js";function be(M){var f=oe(0);return function(){return arguments.length===1?(i(f,t(f)+1),arguments[0]):(t(f),M())}}var e=be(()=>we),xe=X('<div class="grid-item svelte-1tusigw"><p> </p> <img alt="croped image" class="svelte-1tusigw"></div>'),Ie=X(`<h1 class="svelte-1tusigw">dect'insect</h1> <input type="file" accept="image/*" multiple> <h2 class="svelte-1tusigw">Preprocessed Image</h2> <div><canvas></canvas></div> <h2 class="svelte-1tusigw">Cropped Insect</h2> <h3> </h3> <p> </p> <div class="grid-container svelte-1tusigw"></div>`,1);function Te(M,f){ne(f,!1);let o=g(),E=g(),H=g([]),d=null,u=null,$=g([]),Y=_e("class_mapping.txt"),C=g([]),r=g();async function Z(){let a=[];if(e(e().processing.done=0),e(e().processing.total=0),e(e().processing.time=0),e(e().processing.state="loading"),a=await fe(Y),console.log("classmap : ",a),t(o)&&t(o).length>0){d||(d=await V());const R=t(o)[0],U=await createImageBitmap(R),h=640,_=640;J(r,t(r).width=h),J(r,t(r).height=_);const n=t(r).getContext("2d");if(!n)throw new Error("Could not get 2d context from canvas");n.drawImage(U,0,0,h,_);const z=n.getImageData(0,0,h,_);e(e().processing.state="inference"),n.putImageData(z,0,0);const w=await Promise.all([...t(o)].map(s=>s.arrayBuffer()));var v=await de(w,d,e());let b=v[0],l=v[2],j=v[3];e(e().processing.done=0),e(e().processing.state="postprocessing"),e(e().time=(Date.now()-l)/1e3),e(e().processing.state="finished");let x=await ue(b,j);i($,[]),i(C,[]);for(let s=0;s<x.length;s++){let I=[],D=[];for(let p=0;p<x[s].length;p++)I.push("en profonde réflexion..."),D.push(0);t($).push(I),t(C).push(D)}e(e().processing.time=(Date.now()-l)/1e3),e(e().processing.state="visualizing"),e(e().processing.done=0);let A=[];for(let s=0;s<x.length;s++){let I=[],D=x[s];for(let p=0;p<D.length;p++){let ie=D[p].toDataURL();I.push(ie),e(e().processing.done+=1),e(e().processing.time=(Date.now()-l)/1e3)}A.push(I)}i(H,A),d.release(),d=null,u||(u=await V(!0));let se=await ve(x,u,e(),l),B=he(se,a);i($,B[0]),i(C,B[1]),u.release(),u=null,console.log("finiiiiis")}}me();var O=Ie(),P=c(F(O),2),L=c(P,4),ee=y(L);Q(ee,a=>i(r,a),()=>t(r)),m(L),Q(L,a=>i(E,a),()=>t(E));var S=c(L,4),te=y(S,!0);m(S);var T=c(S,2),ae=y(T);m(T);var W=c(T,2);K(W,5,()=>t(H),N,(a,v,R)=>{var U=re(),h=F(U);K(h,1,()=>t(v),N,(_,n,z)=>{var w=xe(),b=y(w),l=y(b);m(b);var j=c(b,2);m(w),G(()=>{q(l,`${t($)[R][z]??""}:
					${t(C)[R][z]??""}`),ce(j,"src",t(n))}),k(_,w)}),k(a,U)}),m(W),G(()=>{q(te,e().processing.state),q(ae,`image proceed : ${e().processing.done??""} ; time taken (s): ${e().processing.time??""}`)}),ge(P,()=>t(o),a=>i(o,a)),pe("change",P,Z),k(M,O),le()}export{Te as component};
