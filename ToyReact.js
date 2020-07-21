class ElementWrapper {
  // warpper 其实就是创建一个dom
  constructor(type) {
    this.root = document.createElement(type);
  }
  setAttribute(name, value) {
    this.root.setAttribute(name, value);
  }
  appendChild(vchild) {
    vchild.mountTo(this.root);
  }
  mountTo(parent) {
    parent.appendChild(this.root);
  }
}

class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content)
  }

  mountTo(parent) {
    parent.appendChild(this.root)
  }
}
// 公共方法
export class Component {
  constructor() {
    this.children = []
  }
  setAttribute(name, value) {
    this[name] = value;
  }
  mountTo(parent) {
    let vdom = this.render()
    vdom.mountTo(parent)
  }
  appendChild(vchild) {
    this.children.push(vchild)
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
    vdom.mountTo(element)
  }
}