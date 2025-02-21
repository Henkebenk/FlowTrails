import { unref, inject, hasInjectionContext, getCurrentInstance, version, createApp, provide, toRef, onErrorCaptured, onServerPrefetch, createVNode, resolveDynamicComponent, shallowReactive, reactive, effectScope, computed, defineComponent, h, isReadonly, isRef, isShallow, isReactive, toRaw, defineAsyncComponent, mergeProps, getCurrentScope, useSSRContext } from 'vue';
import { h as hasProtocol, i as isScriptProtocol, k as joinURL, w as withQuery, s as sanitizeStatusCode, l as getContext, $ as $fetch, m as createHooks, c as createError$1, n as isEqual, o as stringifyParsedURL, p as stringifyQuery, q as parseQuery, t as toRouteMatcher, r as createRouter, v as defu } from '../nitro/nitro.mjs';
import { b as baseURL } from '../routes/renderer.mjs';
import { getActiveHead, CapoPlugin } from 'unhead';
import { defineHeadPlugin } from '@unhead/shared';
import { ssrRenderSuspense, ssrRenderComponent, ssrRenderVNode, ssrRenderAttrs, ssrRenderAttr } from 'vue/server-renderer';
import 'node:http';
import 'node:https';
import 'node:fs';
import 'node:path';
import 'node:url';
import 'vue-bundle-renderer/runtime';
import 'devalue';
import '@unhead/ssr';

if (!globalThis.$fetch) {
  globalThis.$fetch = $fetch.create({
    baseURL: baseURL()
  });
}
const nuxtLinkDefaults = { "componentName": "NuxtLink" };
const appId = "nuxt-app";
function getNuxtAppCtx(id = appId) {
  return getContext(id, {
    asyncContext: false
  });
}
const NuxtPluginIndicator = "__nuxt_plugin";
function createNuxtApp(options) {
  var _a;
  let hydratingCount = 0;
  const nuxtApp = {
    _id: options.id || appId || "nuxt-app",
    _scope: effectScope(),
    provide: void 0,
    globalName: "nuxt",
    versions: {
      get nuxt() {
        return "3.15.4";
      },
      get vue() {
        return nuxtApp.vueApp.version;
      }
    },
    payload: shallowReactive({
      ...((_a = options.ssrContext) == null ? void 0 : _a.payload) || {},
      data: shallowReactive({}),
      state: reactive({}),
      once: /* @__PURE__ */ new Set(),
      _errors: shallowReactive({})
    }),
    static: {
      data: {}
    },
    runWithContext(fn) {
      if (nuxtApp._scope.active && !getCurrentScope()) {
        return nuxtApp._scope.run(() => callWithNuxt(nuxtApp, fn));
      }
      return callWithNuxt(nuxtApp, fn);
    },
    isHydrating: false,
    deferHydration() {
      if (!nuxtApp.isHydrating) {
        return () => {
        };
      }
      hydratingCount++;
      let called = false;
      return () => {
        if (called) {
          return;
        }
        called = true;
        hydratingCount--;
        if (hydratingCount === 0) {
          nuxtApp.isHydrating = false;
          return nuxtApp.callHook("app:suspense:resolve");
        }
      };
    },
    _asyncDataPromises: {},
    _asyncData: shallowReactive({}),
    _payloadRevivers: {},
    ...options
  };
  {
    nuxtApp.payload.serverRendered = true;
  }
  if (nuxtApp.ssrContext) {
    nuxtApp.payload.path = nuxtApp.ssrContext.url;
    nuxtApp.ssrContext.nuxt = nuxtApp;
    nuxtApp.ssrContext.payload = nuxtApp.payload;
    nuxtApp.ssrContext.config = {
      public: nuxtApp.ssrContext.runtimeConfig.public,
      app: nuxtApp.ssrContext.runtimeConfig.app
    };
  }
  nuxtApp.hooks = createHooks();
  nuxtApp.hook = nuxtApp.hooks.hook;
  {
    const contextCaller = async function(hooks, args) {
      for (const hook of hooks) {
        await nuxtApp.runWithContext(() => hook(...args));
      }
    };
    nuxtApp.hooks.callHook = (name, ...args) => nuxtApp.hooks.callHookWith(contextCaller, name, ...args);
  }
  nuxtApp.callHook = nuxtApp.hooks.callHook;
  nuxtApp.provide = (name, value) => {
    const $name = "$" + name;
    defineGetter(nuxtApp, $name, value);
    defineGetter(nuxtApp.vueApp.config.globalProperties, $name, value);
  };
  defineGetter(nuxtApp.vueApp, "$nuxt", nuxtApp);
  defineGetter(nuxtApp.vueApp.config.globalProperties, "$nuxt", nuxtApp);
  const runtimeConfig = options.ssrContext.runtimeConfig;
  nuxtApp.provide("config", runtimeConfig);
  return nuxtApp;
}
function registerPluginHooks(nuxtApp, plugin) {
  if (plugin.hooks) {
    nuxtApp.hooks.addHooks(plugin.hooks);
  }
}
async function applyPlugin(nuxtApp, plugin) {
  if (typeof plugin === "function") {
    const { provide: provide2 } = await nuxtApp.runWithContext(() => plugin(nuxtApp)) || {};
    if (provide2 && typeof provide2 === "object") {
      for (const key in provide2) {
        nuxtApp.provide(key, provide2[key]);
      }
    }
  }
}
async function applyPlugins(nuxtApp, plugins2) {
  var _a, _b, _c, _d;
  const resolvedPlugins = [];
  const unresolvedPlugins = [];
  const parallels = [];
  const errors = [];
  let promiseDepth = 0;
  async function executePlugin(plugin) {
    var _a2;
    const unresolvedPluginsForThisPlugin = ((_a2 = plugin.dependsOn) == null ? void 0 : _a2.filter((name) => plugins2.some((p) => p._name === name) && !resolvedPlugins.includes(name))) ?? [];
    if (unresolvedPluginsForThisPlugin.length > 0) {
      unresolvedPlugins.push([new Set(unresolvedPluginsForThisPlugin), plugin]);
    } else {
      const promise = applyPlugin(nuxtApp, plugin).then(async () => {
        if (plugin._name) {
          resolvedPlugins.push(plugin._name);
          await Promise.all(unresolvedPlugins.map(async ([dependsOn, unexecutedPlugin]) => {
            if (dependsOn.has(plugin._name)) {
              dependsOn.delete(plugin._name);
              if (dependsOn.size === 0) {
                promiseDepth++;
                await executePlugin(unexecutedPlugin);
              }
            }
          }));
        }
      });
      if (plugin.parallel) {
        parallels.push(promise.catch((e) => errors.push(e)));
      } else {
        await promise;
      }
    }
  }
  for (const plugin of plugins2) {
    if (((_a = nuxtApp.ssrContext) == null ? void 0 : _a.islandContext) && ((_b = plugin.env) == null ? void 0 : _b.islands) === false) {
      continue;
    }
    registerPluginHooks(nuxtApp, plugin);
  }
  for (const plugin of plugins2) {
    if (((_c = nuxtApp.ssrContext) == null ? void 0 : _c.islandContext) && ((_d = plugin.env) == null ? void 0 : _d.islands) === false) {
      continue;
    }
    await executePlugin(plugin);
  }
  await Promise.all(parallels);
  if (promiseDepth) {
    for (let i = 0; i < promiseDepth; i++) {
      await Promise.all(parallels);
    }
  }
  if (errors.length) {
    throw errors[0];
  }
}
// @__NO_SIDE_EFFECTS__
function defineNuxtPlugin(plugin) {
  if (typeof plugin === "function") {
    return plugin;
  }
  const _name = plugin._name || plugin.name;
  delete plugin.name;
  return Object.assign(plugin.setup || (() => {
  }), plugin, { [NuxtPluginIndicator]: true, _name });
}
function callWithNuxt(nuxt, setup, args) {
  const fn = () => setup();
  const nuxtAppCtx = getNuxtAppCtx(nuxt._id);
  {
    return nuxt.vueApp.runWithContext(() => nuxtAppCtx.callAsync(nuxt, fn));
  }
}
function tryUseNuxtApp(id) {
  var _a;
  let nuxtAppInstance;
  if (hasInjectionContext()) {
    nuxtAppInstance = (_a = getCurrentInstance()) == null ? void 0 : _a.appContext.app.$nuxt;
  }
  nuxtAppInstance = nuxtAppInstance || getNuxtAppCtx(id).tryUse();
  return nuxtAppInstance || null;
}
function useNuxtApp(id) {
  const nuxtAppInstance = tryUseNuxtApp(id);
  if (!nuxtAppInstance) {
    {
      throw new Error("[nuxt] instance unavailable");
    }
  }
  return nuxtAppInstance;
}
// @__NO_SIDE_EFFECTS__
function useRuntimeConfig(_event) {
  return useNuxtApp().$config;
}
function defineGetter(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}
const PageRouteSymbol = Symbol("route");
const useRouter = () => {
  var _a;
  return (_a = useNuxtApp()) == null ? void 0 : _a.$router;
};
const useRoute = () => {
  if (hasInjectionContext()) {
    return inject(PageRouteSymbol, useNuxtApp()._route);
  }
  return useNuxtApp()._route;
};
// @__NO_SIDE_EFFECTS__
function defineNuxtRouteMiddleware(middleware) {
  return middleware;
}
const isProcessingMiddleware = () => {
  try {
    if (useNuxtApp()._processingMiddleware) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
};
const URL_QUOTE_RE = /"/g;
const navigateTo = (to, options) => {
  if (!to) {
    to = "/";
  }
  const toPath = typeof to === "string" ? to : "path" in to ? resolveRouteObject(to) : useRouter().resolve(to).href;
  const isExternalHost = hasProtocol(toPath, { acceptRelative: true });
  const isExternal = (options == null ? void 0 : options.external) || isExternalHost;
  if (isExternal) {
    if (!(options == null ? void 0 : options.external)) {
      throw new Error("Navigating to an external URL is not allowed by default. Use `navigateTo(url, { external: true })`.");
    }
    const { protocol } = new URL(toPath, "http://localhost");
    if (protocol && isScriptProtocol(protocol)) {
      throw new Error(`Cannot navigate to a URL with '${protocol}' protocol.`);
    }
  }
  const inMiddleware = isProcessingMiddleware();
  const router = useRouter();
  const nuxtApp = useNuxtApp();
  {
    if (nuxtApp.ssrContext) {
      const fullPath = typeof to === "string" || isExternal ? toPath : router.resolve(to).fullPath || "/";
      const location2 = isExternal ? toPath : joinURL((/* @__PURE__ */ useRuntimeConfig()).app.baseURL, fullPath);
      const redirect = async function(response) {
        await nuxtApp.callHook("app:redirected");
        const encodedLoc = location2.replace(URL_QUOTE_RE, "%22");
        const encodedHeader = encodeURL(location2, isExternalHost);
        nuxtApp.ssrContext._renderResponse = {
          statusCode: sanitizeStatusCode((options == null ? void 0 : options.redirectCode) || 302, 302),
          body: `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`,
          headers: { location: encodedHeader }
        };
        return response;
      };
      if (!isExternal && inMiddleware) {
        router.afterEach((final) => final.fullPath === fullPath ? redirect(false) : void 0);
        return to;
      }
      return redirect(!inMiddleware ? void 0 : (
        /* abort route navigation */
        false
      ));
    }
  }
  if (isExternal) {
    nuxtApp._scope.stop();
    if (options == null ? void 0 : options.replace) {
      (void 0).replace(toPath);
    } else {
      (void 0).href = toPath;
    }
    if (inMiddleware) {
      if (!nuxtApp.isHydrating) {
        return false;
      }
      return new Promise(() => {
      });
    }
    return Promise.resolve();
  }
  return (options == null ? void 0 : options.replace) ? router.replace(to) : router.push(to);
};
function resolveRouteObject(to) {
  return withQuery(to.path || "", to.query || {}) + (to.hash || "");
}
function encodeURL(location2, isExternalHost = false) {
  const url = new URL(location2, "http://localhost");
  if (!isExternalHost) {
    return url.pathname + url.search + url.hash;
  }
  if (location2.startsWith("//")) {
    return url.toString().replace(url.protocol, "");
  }
  return url.toString();
}
const NUXT_ERROR_SIGNATURE = "__nuxt_error";
const useError = () => toRef(useNuxtApp().payload, "error");
const showError = (error) => {
  const nuxtError = createError(error);
  try {
    const nuxtApp = useNuxtApp();
    const error2 = useError();
    if (false) ;
    error2.value = error2.value || nuxtError;
  } catch {
    throw nuxtError;
  }
  return nuxtError;
};
const isNuxtError = (error) => !!error && typeof error === "object" && NUXT_ERROR_SIGNATURE in error;
const createError = (error) => {
  const nuxtError = createError$1(error);
  Object.defineProperty(nuxtError, NUXT_ERROR_SIGNATURE, {
    value: true,
    configurable: false,
    writable: false
  });
  return nuxtError;
};
version[0] === "3";
function resolveUnref(r) {
  return typeof r === "function" ? r() : unref(r);
}
function resolveUnrefHeadInput(ref) {
  if (ref instanceof Promise || ref instanceof Date || ref instanceof RegExp)
    return ref;
  const root = resolveUnref(ref);
  if (!ref || !root)
    return root;
  if (Array.isArray(root))
    return root.map((r) => resolveUnrefHeadInput(r));
  if (typeof root === "object") {
    const resolved = {};
    for (const k in root) {
      if (!Object.prototype.hasOwnProperty.call(root, k)) {
        continue;
      }
      if (k === "titleTemplate" || k[0] === "o" && k[1] === "n") {
        resolved[k] = unref(root[k]);
        continue;
      }
      resolved[k] = resolveUnrefHeadInput(root[k]);
    }
    return resolved;
  }
  return root;
}
defineHeadPlugin({
  hooks: {
    "entries:resolve": (ctx) => {
      for (const entry2 of ctx.entries)
        entry2.resolvedInput = resolveUnrefHeadInput(entry2.input);
    }
  }
});
const headSymbol = "usehead";
const _global = typeof globalThis !== "undefined" ? globalThis : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
const globalKey$1 = "__unhead_injection_handler__";
function setHeadInjectionHandler(handler) {
  _global[globalKey$1] = handler;
}
function injectHead() {
  if (globalKey$1 in _global) {
    return _global[globalKey$1]();
  }
  const head = inject(headSymbol);
  return head || getActiveHead();
}
[CapoPlugin({ track: true })];
const unhead_KgADcZ0jPj = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:head",
  enforce: "pre",
  setup(nuxtApp) {
    const head = nuxtApp.ssrContext.head;
    setHeadInjectionHandler(
      // need a fresh instance of the nuxt app to avoid parallel requests interfering with each other
      () => useNuxtApp().vueApp._context.provides.usehead
    );
    nuxtApp.vueApp.use(head);
  }
});
async function getRouteRules(arg) {
  const path = typeof arg === "string" ? arg : arg.path;
  {
    useNuxtApp().ssrContext._preloadManifest = true;
    const _routeRulesMatcher = toRouteMatcher(
      createRouter({ routes: (/* @__PURE__ */ useRuntimeConfig()).nitro.routeRules })
    );
    return defu({}, ..._routeRulesMatcher.matchAll(path).reverse());
  }
}
function createContext(opts = {}) {
  let currentInstance;
  let isSingleton = false;
  const checkConflict = (instance) => {
    if (currentInstance && currentInstance !== instance) {
      throw new Error("Context conflict");
    }
  };
  let als;
  if (opts.asyncContext) {
    const _AsyncLocalStorage = opts.AsyncLocalStorage || globalThis.AsyncLocalStorage;
    if (_AsyncLocalStorage) {
      als = new _AsyncLocalStorage();
    } else {
      console.warn("[unctx] `AsyncLocalStorage` is not provided.");
    }
  }
  const _getCurrentInstance = () => {
    if (als) {
      const instance = als.getStore();
      if (instance !== void 0) {
        return instance;
      }
    }
    return currentInstance;
  };
  return {
    use: () => {
      const _instance = _getCurrentInstance();
      if (_instance === void 0) {
        throw new Error("Context is not available");
      }
      return _instance;
    },
    tryUse: () => {
      return _getCurrentInstance();
    },
    set: (instance, replace) => {
      if (!replace) {
        checkConflict(instance);
      }
      currentInstance = instance;
      isSingleton = true;
    },
    unset: () => {
      currentInstance = void 0;
      isSingleton = false;
    },
    call: (instance, callback) => {
      checkConflict(instance);
      currentInstance = instance;
      try {
        return als ? als.run(instance, callback) : callback();
      } finally {
        if (!isSingleton) {
          currentInstance = void 0;
        }
      }
    },
    async callAsync(instance, callback) {
      currentInstance = instance;
      const onRestore = () => {
        currentInstance = instance;
      };
      const onLeave = () => currentInstance === instance ? onRestore : void 0;
      asyncHandlers.add(onLeave);
      try {
        const r = als ? als.run(instance, callback) : callback();
        if (!isSingleton) {
          currentInstance = void 0;
        }
        return await r;
      } finally {
        asyncHandlers.delete(onLeave);
      }
    }
  };
}
function createNamespace(defaultOpts = {}) {
  const contexts = {};
  return {
    get(key, opts = {}) {
      if (!contexts[key]) {
        contexts[key] = createContext({ ...defaultOpts, ...opts });
      }
      return contexts[key];
    }
  };
}
const _globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : {};
const globalKey = "__unctx__";
_globalThis[globalKey] || (_globalThis[globalKey] = createNamespace());
const asyncHandlersKey = "__unctx_async_handlers__";
const asyncHandlers = _globalThis[asyncHandlersKey] || (_globalThis[asyncHandlersKey] = /* @__PURE__ */ new Set());
const manifest_45route_45rule = /* @__PURE__ */ defineNuxtRouteMiddleware(async (to) => {
  {
    return;
  }
});
const globalMiddleware = [
  manifest_45route_45rule
];
function getRouteFromPath(fullPath) {
  if (typeof fullPath === "object") {
    fullPath = stringifyParsedURL({
      pathname: fullPath.path || "",
      search: stringifyQuery(fullPath.query || {}),
      hash: fullPath.hash || ""
    });
  }
  const url = new URL(fullPath.toString(), "http://localhost");
  return {
    path: url.pathname,
    fullPath,
    query: parseQuery(url.search),
    hash: url.hash,
    // stub properties for compat with vue-router
    params: {},
    name: void 0,
    matched: [],
    redirectedFrom: void 0,
    meta: {},
    href: fullPath
  };
}
const router_CaKIoANnI2 = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:router",
  enforce: "pre",
  setup(nuxtApp) {
    const initialURL = nuxtApp.ssrContext.url;
    const routes = [];
    const hooks = {
      "navigate:before": [],
      "resolve:before": [],
      "navigate:after": [],
      "error": []
    };
    const registerHook = (hook, guard) => {
      hooks[hook].push(guard);
      return () => hooks[hook].splice(hooks[hook].indexOf(guard), 1);
    };
    (/* @__PURE__ */ useRuntimeConfig()).app.baseURL;
    const route = reactive(getRouteFromPath(initialURL));
    async function handleNavigation(url, replace) {
      try {
        const to = getRouteFromPath(url);
        for (const middleware of hooks["navigate:before"]) {
          const result = await middleware(to, route);
          if (result === false || result instanceof Error) {
            return;
          }
          if (typeof result === "string" && result.length) {
            return handleNavigation(result, true);
          }
        }
        for (const handler of hooks["resolve:before"]) {
          await handler(to, route);
        }
        Object.assign(route, to);
        if (false) ;
        for (const middleware of hooks["navigate:after"]) {
          await middleware(to, route);
        }
      } catch (err) {
        for (const handler of hooks.error) {
          await handler(err);
        }
      }
    }
    const currentRoute = computed(() => route);
    const router = {
      currentRoute,
      isReady: () => Promise.resolve(),
      // These options provide a similar API to vue-router but have no effect
      options: {},
      install: () => Promise.resolve(),
      // Navigation
      push: (url) => handleNavigation(url),
      replace: (url) => handleNavigation(url),
      back: () => (void 0).history.go(-1),
      go: (delta) => (void 0).history.go(delta),
      forward: () => (void 0).history.go(1),
      // Guards
      beforeResolve: (guard) => registerHook("resolve:before", guard),
      beforeEach: (guard) => registerHook("navigate:before", guard),
      afterEach: (guard) => registerHook("navigate:after", guard),
      onError: (handler) => registerHook("error", handler),
      // Routes
      resolve: getRouteFromPath,
      addRoute: (parentName, route2) => {
        routes.push(route2);
      },
      getRoutes: () => routes,
      hasRoute: (name) => routes.some((route2) => route2.name === name),
      removeRoute: (name) => {
        const index = routes.findIndex((route2) => route2.name === name);
        if (index !== -1) {
          routes.splice(index, 1);
        }
      }
    };
    nuxtApp.vueApp.component("RouterLink", defineComponent({
      functional: true,
      props: {
        to: {
          type: String,
          required: true
        },
        custom: Boolean,
        replace: Boolean,
        // Not implemented
        activeClass: String,
        exactActiveClass: String,
        ariaCurrentValue: String
      },
      setup: (props, { slots }) => {
        const navigate = () => handleNavigation(props.to, props.replace);
        return () => {
          var _a;
          const route2 = router.resolve(props.to);
          return props.custom ? (_a = slots.default) == null ? void 0 : _a.call(slots, { href: props.to, navigate, route: route2 }) : h("a", { href: props.to, onClick: (e) => {
            e.preventDefault();
            return navigate();
          } }, slots);
        };
      }
    }));
    nuxtApp._route = route;
    nuxtApp._middleware = nuxtApp._middleware || {
      global: [],
      named: {}
    };
    const initialLayout = nuxtApp.payload.state._layout;
    nuxtApp.hooks.hookOnce("app:created", async () => {
      router.beforeEach(async (to, from) => {
        var _a;
        to.meta = reactive(to.meta || {});
        if (nuxtApp.isHydrating && initialLayout && !isReadonly(to.meta.layout)) {
          to.meta.layout = initialLayout;
        }
        nuxtApp._processingMiddleware = true;
        if (!((_a = nuxtApp.ssrContext) == null ? void 0 : _a.islandContext)) {
          const middlewareEntries = /* @__PURE__ */ new Set([...globalMiddleware, ...nuxtApp._middleware.global]);
          {
            const routeRules = await nuxtApp.runWithContext(() => getRouteRules({ path: to.path }));
            if (routeRules.appMiddleware) {
              for (const key in routeRules.appMiddleware) {
                const guard = nuxtApp._middleware.named[key];
                if (!guard) {
                  return;
                }
                if (routeRules.appMiddleware[key]) {
                  middlewareEntries.add(guard);
                } else {
                  middlewareEntries.delete(guard);
                }
              }
            }
          }
          for (const middleware of middlewareEntries) {
            const result = await nuxtApp.runWithContext(() => middleware(to, from));
            {
              if (result === false || result instanceof Error) {
                const error = result || createError$1({
                  statusCode: 404,
                  statusMessage: `Page Not Found: ${initialURL}`,
                  data: {
                    path: initialURL
                  }
                });
                delete nuxtApp._processingMiddleware;
                return nuxtApp.runWithContext(() => showError(error));
              }
            }
            if (result === true) {
              continue;
            }
            if (result || result === false) {
              return result;
            }
          }
        }
      });
      router.afterEach(() => {
        delete nuxtApp._processingMiddleware;
      });
      await router.replace(initialURL);
      if (!isEqual(route.fullPath, initialURL)) {
        await nuxtApp.runWithContext(() => navigateTo(route.fullPath));
      }
    });
    return {
      provide: {
        route,
        router
      }
    };
  }
});
function definePayloadReducer(name, reduce) {
  {
    useNuxtApp().ssrContext._payloadReducers[name] = reduce;
  }
}
const reducers = [
  ["NuxtError", (data) => isNuxtError(data) && data.toJSON()],
  ["EmptyShallowRef", (data) => isRef(data) && isShallow(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_")],
  ["EmptyRef", (data) => isRef(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_")],
  ["ShallowRef", (data) => isRef(data) && isShallow(data) && data.value],
  ["ShallowReactive", (data) => isReactive(data) && isShallow(data) && toRaw(data)],
  ["Ref", (data) => isRef(data) && data.value],
  ["Reactive", (data) => isReactive(data) && toRaw(data)]
];
const revive_payload_server_eJ33V7gbc6 = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:revive-payload:server",
  setup() {
    for (const [reducer, fn] of reducers) {
      definePayloadReducer(reducer, fn);
    }
  }
});
const components_plugin_KR1HBZs4kY = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:global-components"
});
const plugins = [
  unhead_KgADcZ0jPj,
  router_CaKIoANnI2,
  revive_payload_server_eJ33V7gbc6,
  components_plugin_KR1HBZs4kY
];
const _imports_0$1 = "" + __buildAssetsURL("logo.CSgc3Er-.svg");
const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const _sfc_main$7 = {
  name: "Hero"
};
function _sfc_ssrRender$5(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(mergeProps({ id: "navbar" }, _attrs))} data-v-0c05100a><div id="links" data-v-0c05100a><img${ssrRenderAttr("src", _imports_0$1)} data-v-0c05100a><a href="#hero" data-v-0c05100a>Hero</a><a href="#game" data-v-0c05100a>The Game</a><a href="#about" data-v-0c05100a>About</a></div></div>`);
}
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Navbar.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["ssrRender", _sfc_ssrRender$5], ["__scopeId", "data-v-0c05100a"]]);
const _sfc_main$6 = {
  name: "Hero"
};
function _sfc_ssrRender$4(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(mergeProps({
    class: "hero",
    id: "hero"
  }, _attrs))} data-v-db5a6dab><img${ssrRenderAttr("src", _imports_0$1)} class="header-logo" data-v-db5a6dab></div>`);
}
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Hero.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["ssrRender", _sfc_ssrRender$4], ["__scopeId", "data-v-db5a6dab"]]);
const _sfc_main$5 = {
  data() {
    return {
      gameUrl: "/FlowTrailsGame/FlowTrails.html"
    };
  }
};
function _sfc_ssrRender$3(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(mergeProps({
    class: "game-container",
    id: "game"
  }, _attrs))} data-v-3d1040f1><iframe${ssrRenderAttr("src", $data.gameUrl)} frameborder="0" allowfullscreen data-v-3d1040f1></iframe></div>`);
}
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/GameWindow.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const __nuxt_component_2 = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["ssrRender", _sfc_ssrRender$3], ["__scopeId", "data-v-3d1040f1"]]);
const _imports_0 = "data:image/svg+xml,%3csvg%20height='24'%20viewBox='0%200%2024%2024'%20width='24'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='m12.58%203.12v.01c-.31%200-.62.09-.87.26-.5.35-.56.93-.11%201.3l2.86%202.31-8.73.03h-.01c-.72%200-1.42.47-1.56%201.07-.16.61.34%201.12%201.1%201.12l4.43-.01-7.93%206.09c-.76.57-.99%201.52-.52%202.12.48.61%201.49.61%202.26%200l4.3-3.53s-.07.48-.06.76c0%20.29.1.85.23%201.28.29.93.78%201.78%201.46%202.53.7.77%201.57%201.39%202.57%201.83%201.03.47%202.17.71%203.34.71%201.16%200%202.31-.25%203.35-.72%201-.44%201.86-1.07%202.56-1.84.68-.75%201.17-1.61%201.46-2.53.14-.47.23-.94.29-1.41%200-.47%200-.94-.06-1.41-.13-.91-.44-1.77-.94-2.55-.44-.71-1-1.34-1.69-1.87l-6.89-5.29c-.23-.17-.53-.26-.84-.26m2.76%206.09c1.16%200%202.25.38%203.12%201.08.44.36.79.78%201.04%201.25.27.46.44%201.01.5%201.57.04.56-.04%201.12-.23%201.66-.2.54-.52%201.04-.95%201.49-.89.9-2.13%201.42-3.48%201.42-1.34%200-2.59-.51-3.48-1.41-.43-.44-.75-.95-.95-1.49-.19-.53-.27-1.09-.22-1.66.05-.56.22-1.09.48-1.57.26-.47.62-.89%201.06-1.25.86-.71%201.96-1.09%203.11-1.09m.1%201.4c-.78%200-1.5.28-2.03.73-.54.46-.91%201.1-.94%201.84-.04.75.26%201.45.79%201.97.54.53%201.32.85%202.18.85s1.63-.32%202.18-.85c.53-.52.83-1.22.79-1.97-.04-.74-.41-1.38-.94-1.84-.53-.45-1.25-.73-2.03-.73z'/%3e%3c/svg%3e";
const _imports_1 = "" + __buildAssetsURL("godot.D7jqU_Oo.svg");
const _imports_2 = "data:image/svg+xml,%3csvg%20viewBox='0%200%2024%2024'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='m18.928%2014.179c-.214.09-.427.135-.643.135-.342%200-.65-.059-.923-.178a1.963%201.963%200%200%201%20-.69-.491c-.187-.209-.332-.453-.432-.735s-.149-.586-.149-.911c0-.335.05-.643.149-.93.1-.287.242-.536.429-.747a1.96%201.96%200%200%201%20.69-.501%202.25%202.25%200%200%201%20.923-.183c.23%200%20.451.036.664.104.214.069.408.171.581.304s.316.299.427.496a1.7%201.7%200%200%201%20.206.676h-.935c-.059-.249-.171-.437-.337-.562a.973.973%200%200%200%20-.607-.187c-.221%200-.408.043-.562.128s-.28.199-.375.344-.166.308-.209.491-.066.372-.066.569c0%20.187.021.37.066.548.043.178.114.337.209.479s.221.256.375.342.342.128.562.128c.325%200%20.577-.083.754-.247.178-.164.28-.401.311-.714h-.987v-.737h1.872v2.413h-.624l-.1-.505a1.444%201.444%200%200%201%20-.579.471zm2.896-4.429v3.632h2.176v.828h-3.155v-4.46zm-19.039%202.249c0-.709.343-1.376.948-1.962l1.109%204.221h.764l1.075-3.815%201.06%203.815h.766l1.321-4.856h-.86l-.861%203.725-1.039-3.726h-.788l-1.039%203.725-.84-3.632c1.489-1.025%203.868-1.69%206.548-1.69%202.512%200%204.764.529%206.261%201.445-1.632-1.535-4.565-2.612-7.915-2.614-5.134%200-9.295%202.401-9.295%205.364s4.161%205.367%209.293%205.367c3.338%200%206.261-1.075%207.9-2.6-1.497.911-3.741%201.428-6.244%201.428-4.51-.001-8.164-1.877-8.164-4.195zm9.194-.553a1.184%201.184%200%200%200%20-.444-.384%201.378%201.378%200%200%200%20-.622-.135c-.261%200-.496.047-.7.14a1.313%201.313%200%200%200%20-.489.387c-.244.311-.372.75-.372%201.269%200%20.23.033.448.097.643a1.5%201.5%200%200%200%20.285.515c.261.304.633.465%201.077.465.233%200%20.422-.024.581-.074.138-.043.23-.1.306-.149a1.357%201.357%200%200%200%20.444-.489c.09-.166.135-.323.145-.403l.007-.055h-.633l-.002.045c-.017.206-.287.574-.769.574-.688%200-.852-.498-.864-.937h2.306v-.05a3.15%203.15%200%200%200%20-.085-.766%201.84%201.84%200%200%200%20-.268-.596zm-1.139.05c.51%200%20.783.275.833.84h-1.651c.025-.458.388-.84.818-.84zm4.678.415a1.575%201.575%200%200%200%20-.268-.515%201.25%201.25%200%200%200%20-.437-.346%201.36%201.36%200%200%200%20-.586-.126%201.141%201.141%200%200%200%20-.531.128%201.1%201.1%200%200%200%20-.346.28v-1.49h-.631v4.413h.6v-.301a.964.964%200%200%200%20.211.206c.171.123.382.185.626.185.263%200%20.501-.059.7-.176.178-.104.33-.254.448-.444a1.93%201.93%200%200%200%20.235-.584%202.66%202.66%200%200%200%20.069-.603%201.986%201.986%200%200%200%20-.09-.627zm-.567.717c0%20.346-.069.636-.202.84a.682.682%200%200%201%20-.605.325c-.377%200-.819-.263-.819-1.008%200-.356.045-.631.135-.84.13-.301.351-.446.671-.446.342%200%20.572.133.7.41.106.227.12.505.12.719z'/%3e%3c/svg%3e";
const _imports_3 = "data:image/svg+xml,%3csvg%20height='32'%20viewBox='0%200%2032%2032'%20width='32'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='m24.306%204.019h-4.806l-3.5%205.537-3-5.537h-11l14%2023.981%2014-23.981zm-18.825%202h3.363l7.156%2012.387%207.15-12.387h3.363l-10.512%2018.012z'/%3e%3c/svg%3e";
const _imports_4 = "data:image/svg+xml,%3csvg%20viewBox='0%200%201024%201176.463'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M813.793%20806.675c-40.43%2036.31%204.56%2073.1%2044.427%2049.664%208.877-9-.24-40.63-44.387-49.665zM233.48%20865.3c31.35%2027.152%2079.857-6.76%2094.373-44.628-30.39-40.39-144.237%201.478-94.373%2044.625zm596.948-95.572c0%2017.994%20132.522%2029.79%20132.522-4.24-12.713-23.44-37.136-39.092-65.214-39.092-29.74%200-55.38%2017.56-67.118%2042.875l-.19.458zm-406.962-698.8L69.168%20433.462c-119.686%20148.237%2081.496%20131.002%20167.71%20173.67%2030.953%2031.63-118.565%2054.984-87.615%2086.616%2030.912%2031.63%20187.066%2060.94%20218.058%2092.532%2030.913%2031.63-63.34%2065.18-32.39%2096.772%2030.912%2031.67%20102.49%201.68%20115.887%2074.7%209.517%2052.144%20128.923%2022.393%20187.306-20.315%2030.95-31.632-59.183-28.673-28.232-60.304%2076.9-78.656%20148.558-28.552%20174.87-107.41%2012.997-38.948-113.246-60.022-82.256-91.653%2089.016-51.985%20396.647-85.816%20250.648-231.773L585.98%2070.928C564.89%2050.8%20536.262%2038.414%20504.74%2038.414S444.592%2050.8%20423.46%2070.97l.045-.043zm141.04%2025.47l140.16%20142.36c6.612%207.32%2010.66%2017.067%2010.66%2027.76%200%207.22-1.846%2014.01-5.09%2019.922l.108-.215-69.58-55.664-13.677%2082.418-58.183-30.673-93.093%2058.783-30.83-123.963-50.026%2086.535h-76.498c-31.19%200-34.83-39.588-6.518-67.9%2049.466-53.385%20106.25-107.81%20137.12-139.36%2014.898-14.498%2035.267-23.44%2057.725-23.44s42.826%208.942%2057.742%2023.458l-.02-.018zM338.687%20626.81c9.477%205.877%20152.676%2034.99%20187.666%2040.787%2012.116%202.56%203.52%2015.036-13.196%2023.473-37.708%2010.037-220.614-64.26-174.47-64.26z'/%3e%3c/svg%3e";
const _sfc_main$4 = {
  data() {
    return {
      selectedTab: 0,
      techniques: [
        { name: "Physics", description: "Implemented realistic physics using Godot's built-in physics engine." },
        { name: "Shaders", description: "Used custom shaders to create dynamic terrain and water effects." },
        { name: "Multiplayer", description: "Designed local multiplayer mechanics with split-screen support." }
      ]
    };
  }
};
function _sfc_ssrRender$2(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<!--[--><div data-v-46f418e7><h1 class="cozy-font" id="about" data-v-46f418e7>About</h1><p data-v-46f418e7> Experience tranquility in FlowTrails, a low-poly mountain bike game that invites players to explore serene landscapes. Navigate picturesque trails filled with lush meadows and towering pines in a calming local multiplayer setting </p></div><div data-v-46f418e7><h2 data-v-46f418e7>Controls</h2><div class="controlls" data-v-46f418e7><div class="player-row" data-v-46f418e7><p data-v-46f418e7>Player 1</p><div class="controll-row" data-v-46f418e7><p data-v-46f418e7>Movement: </p><div class="keymaps" data-v-46f418e7><p data-v-46f418e7>W</p><p data-v-46f418e7>A</p><p data-v-46f418e7>S</p><p data-v-46f418e7>D</p></div></div><div class="controll-row" data-v-46f418e7><p data-v-46f418e7>Bell: </p><div class="keymaps" data-v-46f418e7><p data-v-46f418e7>E</p></div></div><div class="controll-row" data-v-46f418e7><p data-v-46f418e7>Dropper post: </p><div class="keymaps" data-v-46f418e7><p data-v-46f418e7>Q</p></div></div></div><div class="player-row" data-v-46f418e7><p data-v-46f418e7>Player 2</p><div class="controll-row" data-v-46f418e7><p data-v-46f418e7>Movement: </p><div class="keymaps" data-v-46f418e7><p data-v-46f418e7>⬆</p><p data-v-46f418e7>⬅</p><p data-v-46f418e7>⬇</p><p data-v-46f418e7>➡</p></div></div><div class="controll-row" data-v-46f418e7><p data-v-46f418e7>Bell: </p><div class="keymaps" data-v-46f418e7><p data-v-46f418e7>RShift</p></div></div><div class="controll-row" data-v-46f418e7><p data-v-46f418e7>Dropper post: </p><div class="keymaps" data-v-46f418e7><p data-v-46f418e7>Pg Dn</p></div></div></div></div></div><div data-v-46f418e7><h2 data-v-46f418e7>The technical stuff</h2><div class="icons" data-v-46f418e7><img${ssrRenderAttr("src", _imports_0)} data-v-46f418e7><img${ssrRenderAttr("src", _imports_1)} data-v-46f418e7><img${ssrRenderAttr("src", _imports_2)} data-v-46f418e7><img${ssrRenderAttr("src", _imports_3)} data-v-46f418e7><img${ssrRenderAttr("src", _imports_4)} data-v-46f418e7></div></div><!--]-->`);
}
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/About.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const __nuxt_component_3 = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["ssrRender", _sfc_ssrRender$2], ["__scopeId", "data-v-46f418e7"]]);
const _sfc_main$3 = {
  name: "Footer"
};
function _sfc_ssrRender$1(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "footer" }, _attrs))} data-v-a0143093><div data-v-a0143093><label data-v-a0143093>© 2025 Henrik Harshagen</label></div></div>`);
}
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Footer.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_4 = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["ssrRender", _sfc_ssrRender$1], ["__scopeId", "data-v-a0143093"]]);
const _sfc_main$2 = {
  methods: {
    handleScroll() {
      if ((void 0).body.scrollTop > 100 || (void 0).documentElement.scrollTop > 300) {
        (void 0).getElementById("navbar").style.top = "0";
      } else {
        (void 0).getElementById("navbar").style.top = "-100px";
      }
    }
  },
  beforeMount() {
    (void 0).addEventListener("scroll", this.handleScroll);
  },
  beforeDestroy() {
    (void 0).removeEventListener("scroll", this.handleScroll);
  }
};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_Navbar = __nuxt_component_0;
  const _component_Hero = __nuxt_component_1;
  const _component_GameWindow = __nuxt_component_2;
  const _component_About = __nuxt_component_3;
  const _component_Footer = __nuxt_component_4;
  _push(`<!--[--><header>`);
  _push(ssrRenderComponent(_component_Navbar, null, null, _parent));
  _push(`</header><main>`);
  _push(ssrRenderComponent(_component_Hero, null, null, _parent));
  _push(ssrRenderComponent(_component_GameWindow, null, null, _parent));
  _push(ssrRenderComponent(_component_About, null, null, _parent));
  _push(`</main><footer>`);
  _push(ssrRenderComponent(_component_Footer, null, null, _parent));
  _push(`</footer><!--]-->`);
}
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("app.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const AppComponent = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["ssrRender", _sfc_ssrRender]]);
const _sfc_main$1 = {
  __name: "nuxt-error-page",
  __ssrInlineRender: true,
  props: {
    error: Object
  },
  setup(__props) {
    const props = __props;
    const _error = props.error;
    _error.stack ? _error.stack.split("\n").splice(1).map((line) => {
      const text = line.replace("webpack:/", "").replace(".vue", ".js").trim();
      return {
        text,
        internal: line.includes("node_modules") && !line.includes(".cache") || line.includes("internal") || line.includes("new Promise")
      };
    }).map((i) => `<span class="stack${i.internal ? " internal" : ""}">${i.text}</span>`).join("\n") : "";
    const statusCode = Number(_error.statusCode || 500);
    const is404 = statusCode === 404;
    const statusMessage = _error.statusMessage ?? (is404 ? "Page Not Found" : "Internal Server Error");
    const description = _error.message || _error.toString();
    const stack = void 0;
    const _Error404 = defineAsyncComponent(() => import('./error-404-BVPcpuLr.mjs'));
    const _Error = defineAsyncComponent(() => import('./error-500-PADRknoD.mjs'));
    const ErrorTemplate = is404 ? _Error404 : _Error;
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(unref(ErrorTemplate), mergeProps({ statusCode: unref(statusCode), statusMessage: unref(statusMessage), description: unref(description), stack: unref(stack) }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-error-page.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "nuxt-root",
  __ssrInlineRender: true,
  setup(__props) {
    const IslandRenderer = () => null;
    const nuxtApp = useNuxtApp();
    nuxtApp.deferHydration();
    nuxtApp.ssrContext.url;
    const SingleRenderer = false;
    provide(PageRouteSymbol, useRoute());
    nuxtApp.hooks.callHookWith((hooks) => hooks.map((hook) => hook()), "vue:setup");
    const error = useError();
    const abortRender = error.value && !nuxtApp.ssrContext.error;
    onErrorCaptured((err, target, info) => {
      nuxtApp.hooks.callHook("vue:error", err, target, info).catch((hookError) => console.error("[nuxt] Error in `vue:error` hook", hookError));
      {
        const p = nuxtApp.runWithContext(() => showError(err));
        onServerPrefetch(() => p);
        return false;
      }
    });
    const islandContext = nuxtApp.ssrContext.islandContext;
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderSuspense(_push, {
        default: () => {
          if (unref(abortRender)) {
            _push(`<div></div>`);
          } else if (unref(error)) {
            _push(ssrRenderComponent(unref(_sfc_main$1), { error: unref(error) }, null, _parent));
          } else if (unref(islandContext)) {
            _push(ssrRenderComponent(unref(IslandRenderer), { context: unref(islandContext) }, null, _parent));
          } else if (unref(SingleRenderer)) {
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(SingleRenderer)), null, null), _parent);
          } else {
            _push(ssrRenderComponent(unref(AppComponent), null, null, _parent));
          }
        },
        _: 1
      });
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-root.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
let entry;
{
  entry = async function createNuxtAppServer(ssrContext) {
    const vueApp = createApp(_sfc_main);
    const nuxt = createNuxtApp({ vueApp, ssrContext });
    try {
      await applyPlugins(nuxt, plugins);
      await nuxt.hooks.callHook("app:created", vueApp);
    } catch (error) {
      await nuxt.hooks.callHook("app:error", error);
      nuxt.payload.error = nuxt.payload.error || createError(error);
    }
    if (ssrContext == null ? void 0 : ssrContext._renderResponse) {
      throw new Error("skipping render");
    }
    return vueApp;
  };
}
const entry$1 = (ssrContext) => entry(ssrContext);

export { _export_sfc as _, useNuxtApp as a, useRuntimeConfig as b, nuxtLinkDefaults as c, resolveUnrefHeadInput as d, entry$1 as default, injectHead as i, navigateTo as n, resolveRouteObject as r, useRouter as u };
//# sourceMappingURL=server.mjs.map
