import{c as v,a as s,t as d}from"./DeTCf0G9.js";import{a9 as _,f as g,aa as h,c as x,r as b,t as y}from"./DrE-zuyI.js";import{s as C}from"./06gPEhSx.js";import{i as S}from"./NOjOiTK7.js";import{a as k,t as w}from"./B6MevOeU.js";import{b as M}from"./Cij6e3iu.js";var P=d('<code class="confidence"> </code>');function D(i,a){_(a,!0);var o=v(),f=g(o);{var n=t=>{var e=P();let c;var m=x(e);b(e),k(e,(r,u)=>{var l;return(l=w)==null?void 0:l(r,u)},()=>`Confiance: ${a.value*100}%`),y(r=>{c=M(e,"",c,{color:`var(--fg-${(a.value<.25?"error":a.value<.5?"warning":a.value<.95?"neutral":"success")??""})`}),C(m,`${r??""}%`)},[()=>Math.round(a.value*100).toString().padStart(2," ")]),s(t,e)};S(f,t=>{a.value&&a.value>0&&a.value<1&&t(n)})}s(i,o),h()}export{D as default};
