import { p as decodeKey } from './chunks/astro/server_DI1JMO09.mjs';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/astro-designed-error-pages_Cri9av1K.mjs';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///Users/ryanfoerster/Documents/Dev/QR-code-generator/","cacheDir":"file:///Users/ryanfoerster/Documents/Dev/QR-code-generator/node_modules/.astro/","outDir":"file:///Users/ryanfoerster/Documents/Dev/QR-code-generator/dist/","srcDir":"file:///Users/ryanfoerster/Documents/Dev/QR-code-generator/src/","publicDir":"file:///Users/ryanfoerster/Documents/Dev/QR-code-generator/public/","buildClientDir":"file:///Users/ryanfoerster/Documents/Dev/QR-code-generator/dist/client/","buildServerDir":"file:///Users/ryanfoerster/Documents/Dev/QR-code-generator/dist/server/","adapterName":"@astrojs/vercel","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/.pnpm/astro@5.14.8_@types+node@24.9.1_@vercel+functions@2.2.13_jiti@2.6.1_lightningcss@1.30.2_3efd57af46b3b5512cc3822f3a6d9587/node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/history.B76qUnU1.css"},{"type":"inline","content":"@keyframes fadeIn{0%{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}.animate-fade-in[data-astro-cid-tal57otx]{animation:fadeIn .6s ease-out}@media(max-width:768px){.grid-cols-1[data-astro-cid-tal57otx].md\\\\:grid-cols-6{grid-template-columns:1fr}}.group[data-astro-cid-tal57otx]:hover .group-hover\\\\[data-astro-cid-tal57otx]:opacity-100{opacity:1}[data-astro-cid-tal57otx]::-webkit-scrollbar{width:8px}[data-astro-cid-tal57otx]::-webkit-scrollbar-track{background:#3741514d;border-radius:4px}[data-astro-cid-tal57otx]::-webkit-scrollbar-thumb{background:linear-gradient(to bottom,#8b5cf6,#db2777);border-radius:4px}[data-astro-cid-tal57otx]::-webkit-scrollbar-thumb:hover{background:linear-gradient(to bottom,#7c3aed,#be185d)}\n"}],"routeData":{"route":"/history","isIndex":false,"type":"page","pattern":"^\\/history\\/?$","segments":[[{"content":"history","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/history.astro","pathname":"/history","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/index.CKFNCvHA.css"},{"type":"external","src":"/_astro/history.B76qUnU1.css"}],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["/Users/ryanfoerster/Documents/Dev/QR-code-generator/src/pages/history.astro",{"propagation":"none","containsHead":true}],["/Users/ryanfoerster/Documents/Dev/QR-code-generator/src/pages/index.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000noop-middleware":"_noop-middleware.mjs","\u0000virtual:astro:actions/noop-entrypoint":"noop-entrypoint.mjs","\u0000@astro-page:src/pages/history@_@astro":"pages/history.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astro-page:node_modules/.pnpm/astro@5.14.8_@types+node@24.9.1_@vercel+functions@2.2.13_jiti@2.6.1_lightningcss@1.30.2_3efd57af46b3b5512cc3822f3a6d9587/node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_B7MesOr5.mjs","/Users/ryanfoerster/Documents/Dev/QR-code-generator/node_modules/.pnpm/astro@5.14.8_@types+node@24.9.1_@vercel+functions@2.2.13_jiti@2.6.1_lightningcss@1.30.2_3efd57af46b3b5512cc3822f3a6d9587/node_modules/astro/dist/assets/services/sharp.js":"chunks/sharp_KOKreztk.mjs","/Users/ryanfoerster/Documents/Dev/QR-code-generator/src/pages/history.astro?astro&type=script&index=0&lang.ts":"_astro/history.astro_astro_type_script_index_0_lang.BUfQDSXU.js","/Users/ryanfoerster/Documents/Dev/QR-code-generator/src/components/QRPaymentGenerator.astro?astro&type=script&index=0&lang.ts":"_astro/QRPaymentGenerator.astro_astro_type_script_index_0_lang.CU3EHli0.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[],"assets":["/_astro/history.B76qUnU1.css","/_astro/index.CKFNCvHA.css","/favicon.svg","/_astro/QRPaymentGenerator.astro_astro_type_script_index_0_lang.CU3EHli0.js","/_astro/history.astro_astro_type_script_index_0_lang.BUfQDSXU.js"],"buildFormat":"directory","checkOrigin":true,"allowedDomains":[],"serverIslandNameMap":[],"key":"6C21XBU65BXfLBPcodnclpEmUB+OKseF+yFQeWOs/Ss="});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = null;

export { manifest };
