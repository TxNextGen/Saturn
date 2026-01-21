(() => {
 
  function safeEncodeUrl(url) {
    if (!url) return url;
    try {
      if (url.startsWith("http://") || url.startsWith("https://")) {
        return self.__scramjet$bundle?.rewriters?.url?.encodeUrl(url) || url;
      }
      return url; 
    } catch {
      console.warn("[Scramjet] Cannot encode URL:", url);
      return url;
    }
  }


  function createLocationProxy() {
    const t = new URL(location.href);
    t.assign = r => location.assign(safeEncodeUrl(r));
    t.reload = () => location.reload();
    t.replace = r => location.replace(safeEncodeUrl(r));
    t.toString = () => t.href;
    return new Proxy(window.location, {
      get(target, prop) {
        return t[prop];
      },
      set(target, prop, value) {
        if (prop === "href") location.href = safeEncodeUrl(value);
        else t[prop] = value;
        return true;
      }
    });
  }
  window.__location = createLocationProxy();

 
  const originalFunction = window.Function;
  window.Function = new Proxy(originalFunction, {
    construct(target, args) {
      if (args.length === 1) return Reflect.construct(target, [self.__scramjet$bundle.rewriters.rewriteJs(args[0])]);
      return Reflect.construct(target, args.map((v, i) => i === args.length - 1 ? self.__scramjet$bundle.rewriters.rewriteJs(v) : v));
    },
    apply(target, thisArg, args) {
      if (args.length === 1) return Reflect.apply(target, thisArg, [self.__scramjet$bundle.rewriters.rewriteJs(args[0])]);
      return Reflect.apply(target, thisArg, args.map((v, i) => i === args.length - 1 ? self.__scramjet$bundle.rewriters.rewriteJs(v) : v));
    }
  });
  window.eval = t => window.Function(t);

  
  window.fetch = new Proxy(window.fetch, {
    apply(target, thisArg, args) {
      if (args[0]) args[0] = safeEncodeUrl(args[0]);
      return Reflect.apply(target, thisArg, args);
    }
  });


  XMLHttpRequest.prototype.open = new Proxy(XMLHttpRequest.prototype.open, {
    apply(target, thisArg, args) {
      if (args[1]) args[1] = safeEncodeUrl(args[1]);
      return Reflect.apply(target, thisArg, args);
    }
  });

  console.log("[Scramjet Client] Loaded safely with URL fixes.");
})();
