class ElementWrapper {
  // warpper 其实就是创建一个dom
  constructor(type) {
    this.root = document.createElement(type);
  };
  setAttribute(name, value) {
    //增加 click 事件
    if (name.match(/^on([\s\S]+)$/)) {
      // 渲染进来 增加 listen
      let eventName = RegExp.$1.replace(/^[\s\S]/, (s) => s.toLowerCase())
      this.root.addEventListener(eventName, value)
    }
    // 修改属性名称 className -> class
    if (name === "className") {
      this.root.setAttribute("class", value);
    }
    this.root.setAttribute(name, value);
  };
  appendChild(vchild) {
    let range = document.createRange();
    if (this.root.children.length) {
      range.setStartAfter(this.root.lastChild)
      range.setEndAfter(this.root.lastChild)
    }else {
      range.setStart(this.root, 0);
      range.setEnd(this.root, 0);
    }
    vchild.mountTo(range);
  };
  mountTo(range) {
    range.deleteContents();
    range.insertNode(this.root);
  }
}

class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content)
  };
  mountTo(range) {
    range.deleteContents();
    range.insertNode(this.root);
  }
}
// 公共方法
export class Component {
  constructor() {
    this.children = []
    this.props = Object.create(null);
  }
  setAttribute(name, value) {
    this.props[name] = value;
    this[name] = value;
  }
  mountTo(range) {
    this.range = range
    this.update();
  }
  update() {
    let placeholder = document.createComment("placeholder");
    let range = document.createRange();
    range.setStart(this.range.endContainer, this.range.endOffset);
    range.setEnd(this.range.endContainer, this.range.endOffset);
    range.insertNode(placeholder);
    this.range.deleteContents();

    let vdom = this.render()
    vdom.mountTo(this.range)

    // placeholder.parentNode.removeChild(placeholder)
  }
  appendChild(vchild) {
    this.children.push(vchild)
  }
  setState(state){
    let merge = (oldState, newState) => {
      for(let p in newState) {
        if (typeof newState[p] === "object") {
          if (typeof oldState[p] !== "object") {
            oldState[p] = {};
          }
          merge(oldState[p], newState[p])
        } else{
          oldState[p] = newState[p]
        }
      }
    }
    if (!this.state && state) {
      this.state = {};
    }
    merge(this.state, state);
    console.log(this.state)
    this.update()
  }
}

export let ToyReact = {
  createElement(type, attributes, ...children) {
    let element;
    if (typeof type === "string") {
      element = new ElementWrapper(type)
    } else {
      element = new type;
    }
    for (let name in attributes) {
      // element[name] = attributes[name] wrong
      element.setAttribute(name, attributes[name])
    }
    // 处理 jsx 多标签插入
    let insertChildren = (children) => {
      for (let child of children) {
        if (typeof child === "object" && child instanceof Array) {
          insertChildren(child);
        } else {
          if (!(child instanceof Component) &&
            !(child instanceof ElementWrapper) &&
            !(child instanceof TextWrapper)) {
            child = String(child);
          }
          if (typeof child === "string") {
            child = new TextWrapper(child);
          }
          element.appendChild(child)
        }
      }
    }
    insertChildren(children);
    return element;
    // 硬dom
    // console.log(arguments)
    // debugger;
    // return document.createElement(type)
  },
  // 将 element 通过 mountTo 挂在到 虚拟Dom上
  render(vdom, element) {
    let range = document.createRange();
    if (element.children.length) {
      range.setStartAfter(element.lastChild)
      range.setEndAfter(element.lastChild)
    } else {
      range.setStart(element, 0)
      range.setEnd(element, 0)
    }
    vdom.mountTo(range)
  }
}