import{c5 as fe}from"./index-bb44bfc4.js";const pe=Symbol(),Z=Object.getPrototypeOf,q=new WeakMap,be=e=>e&&(q.has(e)?q.get(e):Z(e)===Object.prototype||Z(e)===Array.prototype),Ee=e=>be(e)&&e[pe]||null,ee=(e,t=!0)=>{q.set(e,t)},z=e=>typeof e=="object"&&e!==null,w=new WeakMap,x=new WeakSet,Ie=(e=Object.is,t=(o,I)=>new Proxy(o,I),s=o=>z(o)&&!x.has(o)&&(Array.isArray(o)||!(Symbol.iterator in o))&&!(o instanceof WeakMap)&&!(o instanceof WeakSet)&&!(o instanceof Error)&&!(o instanceof Number)&&!(o instanceof Date)&&!(o instanceof String)&&!(o instanceof RegExp)&&!(o instanceof ArrayBuffer),r=o=>{switch(o.status){case"fulfilled":return o.value;case"rejected":throw o.reason;default:throw o}},l=new WeakMap,c=(o,I,C=r)=>{const m=l.get(o);if((m==null?void 0:m[0])===I)return m[1];const g=Array.isArray(o)?[]:Object.create(Object.getPrototypeOf(o));return ee(g,!0),l.set(o,[I,g]),Reflect.ownKeys(o).forEach(U=>{if(Object.getOwnPropertyDescriptor(g,U))return;const _=Reflect.get(o,U),T={value:_,enumerable:!0,configurable:!0};if(x.has(_))ee(_,!1);else if(_ instanceof Promise)delete T.value,T.get=()=>C(_);else if(w.has(_)){const[h,F]=w.get(_);T.value=c(h,F(),C)}Object.defineProperty(g,U,T)}),Object.preventExtensions(g)},b=new WeakMap,p=[1,1],A=o=>{if(!z(o))throw new Error("object required");const I=b.get(o);if(I)return I;let C=p[0];const m=new Set,g=(i,a=++p[0])=>{C!==a&&(C=a,m.forEach(n=>n(i,a)))};let U=p[1];const _=(i=++p[1])=>(U!==i&&!m.size&&(U=i,h.forEach(([a])=>{const n=a[1](i);n>C&&(C=n)})),C),T=i=>(a,n)=>{const E=[...a];E[1]=[i,...E[1]],g(E,n)},h=new Map,F=(i,a)=>{if(m.size){const n=a[3](T(i));h.set(i,[a,n])}else h.set(i,[a])},Y=i=>{var a;const n=h.get(i);n&&(h.delete(i),(a=n[1])==null||a.call(n))},de=i=>(m.add(i),m.size===1&&h.forEach(([n,E],N)=>{const P=n[3](T(N));h.set(N,[n,P])}),()=>{m.delete(i),m.size===0&&h.forEach(([n,E],N)=>{E&&(E(),h.set(N,[n]))})}),H=Array.isArray(o)?[]:Object.create(Object.getPrototypeOf(o)),k=t(H,{deleteProperty(i,a){const n=Reflect.get(i,a);Y(a);const E=Reflect.deleteProperty(i,a);return E&&g(["delete",[a],n]),E},set(i,a,n,E){const N=Reflect.has(i,a),P=Reflect.get(i,a,E);if(N&&(e(P,n)||b.has(n)&&e(P,b.get(n))))return!0;Y(a),z(n)&&(n=Ee(n)||n);let B=n;if(n instanceof Promise)n.then(v=>{n.status="fulfilled",n.value=v,g(["resolve",[a],v])}).catch(v=>{n.status="rejected",n.reason=v,g(["reject",[a],v])});else{!w.has(n)&&s(n)&&(B=A(n));const v=!x.has(B)&&w.get(B);v&&F(a,v)}return Reflect.set(i,a,B,E),g(["set",[a],n,P]),!0}});b.set(o,k);const ue=[H,_,c,de];return w.set(k,ue),Reflect.ownKeys(o).forEach(i=>{const a=Object.getOwnPropertyDescriptor(o,i);"value"in a&&(k[i]=o[i],delete a.value,delete a.writable),Object.defineProperty(H,i,a)}),k})=>[A,w,x,e,t,s,r,l,c,b,p],[me]=Ie();function L(e={}){return me(e)}function R(e,t,s){const r=w.get(e);let l;const c=[],b=r[3];let p=!1;const o=b(I=>{if(c.push(I),s){t(c.splice(0));return}l||(l=Promise.resolve().then(()=>{l=void 0,p&&t(c.splice(0))}))});return p=!0,()=>{p=!1,o()}}function ge(e,t){const s=w.get(e),[r,l,c]=s;return c(r,l(),t)}const d=L({history:["ConnectWallet"],view:"ConnectWallet",data:void 0}),ce={state:d,subscribe(e){return R(d,()=>e(d))},push(e,t){e!==d.view&&(d.view=e,t&&(d.data=t),d.history.push(e))},reset(e){d.view=e,d.history=[e]},replace(e){d.history.length>1&&(d.history[d.history.length-1]=e,d.view=e)},goBack(){if(d.history.length>1){d.history.pop();const[e]=d.history.slice(-1);d.view=e}},setData(e){d.data=e}},f={WALLETCONNECT_DEEPLINK_CHOICE:"WALLETCONNECT_DEEPLINK_CHOICE",WCM_VERSION:"WCM_VERSION",RECOMMENDED_WALLET_AMOUNT:9,isMobile(){return typeof window<"u"?!!(window.matchMedia("(pointer:coarse)").matches||/Android|webOS|iPhone|iPad|iPod|BlackBerry|Opera Mini/u.test(navigator.userAgent)):!1},isAndroid(){return f.isMobile()&&navigator.userAgent.toLowerCase().includes("android")},isIos(){const e=navigator.userAgent.toLowerCase();return f.isMobile()&&(e.includes("iphone")||e.includes("ipad"))},isHttpUrl(e){return e.startsWith("http://")||e.startsWith("https://")},isArray(e){return Array.isArray(e)&&e.length>0},formatNativeUrl(e,t,s){if(f.isHttpUrl(e))return this.formatUniversalUrl(e,t,s);let r=e;r.includes("://")||(r=e.replaceAll("/","").replaceAll(":",""),r=`${r}://`),r.endsWith("/")||(r=`${r}/`),this.setWalletConnectDeepLink(r,s);const l=encodeURIComponent(t);return`${r}wc?uri=${l}`},formatUniversalUrl(e,t,s){if(!f.isHttpUrl(e))return this.formatNativeUrl(e,t,s);let r=e;r.endsWith("/")||(r=`${r}/`),this.setWalletConnectDeepLink(r,s);const l=encodeURIComponent(t);return`${r}wc?uri=${l}`},async wait(e){return new Promise(t=>{setTimeout(t,e)})},openHref(e,t){window.open(e,t,"noreferrer noopener")},setWalletConnectDeepLink(e,t){try{localStorage.setItem(f.WALLETCONNECT_DEEPLINK_CHOICE,JSON.stringify({href:e,name:t}))}catch{console.info("Unable to set WalletConnect deep link")}},setWalletConnectAndroidDeepLink(e){try{const[t]=e.split("?");localStorage.setItem(f.WALLETCONNECT_DEEPLINK_CHOICE,JSON.stringify({href:t,name:"Android"}))}catch{console.info("Unable to set WalletConnect android deep link")}},removeWalletConnectDeepLink(){try{localStorage.removeItem(f.WALLETCONNECT_DEEPLINK_CHOICE)}catch{console.info("Unable to remove WalletConnect deep link")}},setModalVersionInStorage(){try{typeof localStorage<"u"&&localStorage.setItem(f.WCM_VERSION,"2.6.2")}catch{console.info("Unable to set Web3Modal version in storage")}},getWalletRouterData(){var e;const t=(e=ce.state.data)==null?void 0:e.Wallet;if(!t)throw new Error('Missing "Wallet" view data');return t}},he=typeof location<"u"&&(location.hostname.includes("localhost")||location.protocol.includes("https")),u=L({enabled:he,userSessionId:"",events:[],connectedWalletId:void 0}),ye={state:u,subscribe(e){return R(u.events,()=>e(ge(u.events[u.events.length-1])))},initialize(){u.enabled&&typeof(crypto==null?void 0:crypto.randomUUID)<"u"&&(u.userSessionId=crypto.randomUUID())},setConnectedWalletId(e){u.connectedWalletId=e},click(e){if(u.enabled){const t={type:"CLICK",name:e.name,userSessionId:u.userSessionId,timestamp:Date.now(),data:e};u.events.push(t)}},track(e){if(u.enabled){const t={type:"TRACK",name:e.name,userSessionId:u.userSessionId,timestamp:Date.now(),data:e};u.events.push(t)}},view(e){if(u.enabled){const t={type:"VIEW",name:e.name,userSessionId:u.userSessionId,timestamp:Date.now(),data:e};u.events.push(t)}}},O=L({chains:void 0,walletConnectUri:void 0,isAuth:!1,isCustomDesktop:!1,isCustomMobile:!1,isDataLoaded:!1,isUiLoaded:!1}),y={state:O,subscribe(e){return R(O,()=>e(O))},setChains(e){O.chains=e},setWalletConnectUri(e){O.walletConnectUri=e},setIsCustomDesktop(e){O.isCustomDesktop=e},setIsCustomMobile(e){O.isCustomMobile=e},setIsDataLoaded(e){O.isDataLoaded=e},setIsUiLoaded(e){O.isUiLoaded=e},setIsAuth(e){O.isAuth=e}},$=L({projectId:"",mobileWallets:void 0,desktopWallets:void 0,walletImages:void 0,chains:void 0,enableAuthMode:!1,enableExplorer:!0,explorerExcludedWalletIds:void 0,explorerRecommendedWalletIds:void 0,termsOfServiceUrl:void 0,privacyPolicyUrl:void 0}),M={state:$,subscribe(e){return R($,()=>e($))},setConfig(e){var t,s;ye.initialize(),y.setChains(e.chains),y.setIsAuth(!!e.enableAuthMode),y.setIsCustomMobile(!!((t=e.mobileWallets)!=null&&t.length)),y.setIsCustomDesktop(!!((s=e.desktopWallets)!=null&&s.length)),f.setModalVersionInStorage(),Object.assign($,e)}};var Ce=Object.defineProperty,te=Object.getOwnPropertySymbols,Oe=Object.prototype.hasOwnProperty,De=Object.prototype.propertyIsEnumerable,se=(e,t,s)=>t in e?Ce(e,t,{enumerable:!0,configurable:!0,writable:!0,value:s}):e[t]=s,_e=(e,t)=>{for(var s in t||(t={}))Oe.call(t,s)&&se(e,s,t[s]);if(te)for(var s of te(t))De.call(t,s)&&se(e,s,t[s]);return e};const G="https://explorer-api.walletconnect.com",Q="wcm",X="js-2.6.2";async function K(e,t){const s=_e({sdkType:Q,sdkVersion:X},t),r=new URL(e,G);return r.searchParams.append("projectId",M.state.projectId),Object.entries(s).forEach(([l,c])=>{c&&r.searchParams.append(l,String(c))}),(await fetch(r)).json()}const S={async getDesktopListings(e){return K("/w3m/v1/getDesktopListings",e)},async getMobileListings(e){return K("/w3m/v1/getMobileListings",e)},async getInjectedListings(e){return K("/w3m/v1/getInjectedListings",e)},async getAllListings(e){return K("/w3m/v1/getAllListings",e)},getWalletImageUrl(e){return`${G}/w3m/v1/getWalletImage/${e}?projectId=${M.state.projectId}&sdkType=${Q}&sdkVersion=${X}`},getAssetImageUrl(e){return`${G}/w3m/v1/getAssetImage/${e}?projectId=${M.state.projectId}&sdkType=${Q}&sdkVersion=${X}`}};var Ae=Object.defineProperty,oe=Object.getOwnPropertySymbols,ve=Object.prototype.hasOwnProperty,we=Object.prototype.propertyIsEnumerable,ne=(e,t,s)=>t in e?Ae(e,t,{enumerable:!0,configurable:!0,writable:!0,value:s}):e[t]=s,Le=(e,t)=>{for(var s in t||(t={}))ve.call(t,s)&&ne(e,s,t[s]);if(oe)for(var s of oe(t))we.call(t,s)&&ne(e,s,t[s]);return e};const re=f.isMobile(),D=L({wallets:{listings:[],total:0,page:1},search:{listings:[],total:0,page:1},recomendedWallets:[]}),Pe={state:D,async getRecomendedWallets(){const{explorerRecommendedWalletIds:e,explorerExcludedWalletIds:t}=M.state;if(e==="NONE"||t==="ALL"&&!e)return D.recomendedWallets;if(f.isArray(e)){const s={recommendedIds:e.join(",")},{listings:r}=await S.getAllListings(s),l=Object.values(r);l.sort((c,b)=>{const p=e.indexOf(c.id),A=e.indexOf(b.id);return p-A}),D.recomendedWallets=l}else{const{chains:s,isAuth:r}=y.state,l=s==null?void 0:s.join(","),c=f.isArray(t),b={page:1,sdks:r?"auth_v1":void 0,entries:f.RECOMMENDED_WALLET_AMOUNT,chains:l,version:2,excludedIds:c?t.join(","):void 0},{listings:p}=re?await S.getMobileListings(b):await S.getDesktopListings(b);D.recomendedWallets=Object.values(p)}return D.recomendedWallets},async getWallets(e){const t=Le({},e),{explorerRecommendedWalletIds:s,explorerExcludedWalletIds:r}=M.state,{recomendedWallets:l}=D;if(r==="ALL")return D.wallets;l.length?t.excludedIds=l.map(C=>C.id).join(","):f.isArray(s)&&(t.excludedIds=s.join(",")),f.isArray(r)&&(t.excludedIds=[t.excludedIds,r].filter(Boolean).join(",")),y.state.isAuth&&(t.sdks="auth_v1");const{page:c,search:b}=e,{listings:p,total:A}=re?await S.getMobileListings(t):await S.getDesktopListings(t),o=Object.values(p),I=b?"search":"wallets";return D[I]={listings:[...D[I].listings,...o],total:A,page:c??1},{listings:o,total:A}},getWalletImageUrl(e){return S.getWalletImageUrl(e)},getAssetImageUrl(e){return S.getAssetImageUrl(e)},resetSearch(){D.search={listings:[],total:0,page:1}}},j=L({open:!1}),J={state:j,subscribe(e){return R(j,()=>e(j))},async open(e){return new Promise(t=>{const{isUiLoaded:s,isDataLoaded:r}=y.state;if(f.removeWalletConnectDeepLink(),y.setWalletConnectUri(e==null?void 0:e.uri),y.setChains(e==null?void 0:e.chains),ce.reset("ConnectWallet"),s&&r)j.open=!0,t();else{const l=setInterval(()=>{const c=y.state;c.isUiLoaded&&c.isDataLoaded&&(clearInterval(l),j.open=!0,t())},200)}})},close(){j.open=!1}};var Te=Object.defineProperty,ae=Object.getOwnPropertySymbols,Se=Object.prototype.hasOwnProperty,We=Object.prototype.propertyIsEnumerable,ie=(e,t,s)=>t in e?Te(e,t,{enumerable:!0,configurable:!0,writable:!0,value:s}):e[t]=s,Re=(e,t)=>{for(var s in t||(t={}))Se.call(t,s)&&ie(e,s,t[s]);if(ae)for(var s of ae(t))We.call(t,s)&&ie(e,s,t[s]);return e};function Ue(){return typeof matchMedia<"u"&&matchMedia("(prefers-color-scheme: dark)").matches}const V=L({themeMode:Ue()?"dark":"light"}),le={state:V,subscribe(e){return R(V,()=>e(V))},setThemeConfig(e){const{themeMode:t,themeVariables:s}=e;t&&(V.themeMode=t),s&&(V.themeVariables=Re({},s))}},W=L({open:!1,message:"",variant:"success"}),Ve={state:W,subscribe(e){return R(W,()=>e(W))},openToast(e,t){W.open=!0,W.message=e,W.variant=t},closeToast(){W.open=!1}};class Ne{constructor(t){this.openModal=J.open,this.closeModal=J.close,this.subscribeModal=J.subscribe,this.setTheme=le.setThemeConfig,le.setThemeConfig(t),M.setConfig(t),this.initUi()}async initUi(){if(typeof window<"u"){await fe(()=>import("./index-b032c82e.js"),["assets/index-b032c82e.js","assets/dijkstra-f906a09e.js","assets/index-bb44bfc4.js","assets/index-1361af03.css"]);const t=document.createElement("wcm-modal");document.body.insertAdjacentElement("beforeend",t),y.setIsUiLoaded(!0)}}}const ke=Object.freeze(Object.defineProperty({__proto__:null,WalletConnectModal:Ne},Symbol.toStringTag,{value:"Module"}));export{ye as R,ce as T,f as a,ke as i,le as n,Ve as o,y as p,J as s,Pe as t,M as y};