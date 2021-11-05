const getScrollTop = () => {
  return document.documentElement.scrollTop || document.body.scrollTop;
};

const getViewPortHeight = () => {
  return document.documentElement.clientHeight || document.body.clientHeight;
};

let vendor = (() => {
  let element = document.createElement("div");
  element.style.display = "none";
  let transformNames = {
    webkit: "webkitTransform",
    Moz: "MozTransform",
    O: "OTransform",
    ms: "msTransform",
    standard: "transform",
  };
  for (let key in transformNames) {
    if (element.style[transformNames[key]] !== undefined) {
      return key;
    }
  }
  return false;
})();

const prefixStyle = (style) => {
  if (vendor === false) {
    return false;
  }

  if (vendor === "standard") {
    return style;
  }

  return vendor + style.charAt(0).toUpperCase() + style.substring(1);
};

export default { getScrollTop, getViewPortHeight, prefixStyle };
