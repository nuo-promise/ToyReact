let childrenSymbol = Symbol("children")
class ElementWrapper {
  // warpper 其实就是创建一个dom
  constructor(type) {
    this.type = type;
    this.props = Object.create(null);
    this.children = [];
    this[childrenSymbol] = [];
  };
  setAttribute(name, value) {
    //增加 click 事件
   /* if (name.match(/^on([\s\S]+)$/)) {
      // 渲染进来 增加 listen
      let eventName = RegExp.$1.replace(/^[\s\S]/, (s) => s.toLowerCase())
      this.root.addEventListener(eventName, value)
    }
    // 修改属性名称 className -> class
    if (name === "className") {
      this.root.setAttribute("class", value);
    }
    this.root.setAttribute(name, value);*/
    this.props[name] = value;
  };
  appendChild(vchild) {
    this[childrenSymbol].push(vchild)
    this.children.push(vchild)
  /*  let range = document.createRange();
    if (this.root.children.length) {
      range.setStartAfter(this.root.lastChild)
      range.setEndAfter(this.root.lastChild)
    }else {
      range.setStart(this.root, 0);
      range.setEnd(this.root, 0);
    }
    vchild.mountTo(range);*/

  };
  get vdom(){
    return this
  }
  mountTo(range) {
    this.range = range;
    let placeholder = document.createComment("placeholder")
    let endRange = document.createRange()
    endRange.setStart(range.endContainer, range.endOffset)
    endRange.setEnd(range.endContainer, range.endOffset)
    endRange.insertNode(placeholder)

    range.deleteContents();
    let element = document.createElement(this.type)

    for(let name in this.props) {
      let value = this.props[name];
      if (name.match(/^on([\s\S]+)$/)) {
        let eventName = RegExp.$1.replace(/^[\s\S]/, (s) => s.toLowerCase())
        element.addEventListener(eventName, value)
      }
      if (name === "className") {
        element.setAttribute("class", value);
      }
      element.setAttribute(name, value)
    }
    for(let child of this.children) {
      let range = document.createRange();
      if (element.children.length) {
        range.setStartAfter(element.lastChild)
        range.setEndAfter(element.lastChild)
      } else {
        range.setStart(element, 0);
        range.setEnd(element, 0);
      }
      child.mountTo(range);
    }
    range.insertNode(element);
  }
}

class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content)
    this.type = "#text";
    this.children = [];
    this.props = Object.create(null);
  };
  mountTo(range) {
    this.range = range;
    range.deleteContents();
    range.insertNode(this.root);
  }
  get vdom(){
    return this;
  }
}
// 公共方法
export class Component {
  constructor() {
    this.children = []
    this.props = Object.create(null);
  }
  get type() {
    return this.constructor.name;
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
    let vdom = this.vdom
    if (this.oldVdom) {
      let isSameNode = (node1, node2) => {
        if (node1.type !== node2.type) {
          return false
        }
        for(let name in node1.props){
          if(typeof node1.props[name] === "object" && typeof node2.props[name] === "object" && JSON.stringify(node1.props[name]) === JSON.stringify(node2.props[name])){
            continue;
          }
          if (node1.props[name] !== node2.props[name]) {
            return false;
          }
        }
        if (Object.keys(node1.props).length !== Object.keys(node2.props).length) {
          return false;
        }
        return true;
      }
      let isSameTree = (node1, node2) => {
        if (!isSameNode(node1,node2)) {
          return false;
        }
        if (node1.children.length !== node2.children.length) {
          return false;
        }
        for(let i = 0 ; i < node1.children.length; i++) {
          if(!isSameNode(node1.children[i], node2.children[i])){
            return false;
          }
        }
        return true;
      }
      // indent 是 日志输出每次回缩进
      let replace = (newTree, oldTree, indent) => {
        console.log(indent + "new:", newTree)
        console.log(indent + "old:", oldTree)
        if (isSameTree(newTree, oldTree)) {
          return;
        }
        if (!isSameNode(newTree, oldTree)) {
          vdom.mountTo(oldTree.range)
        } else {
          for(let i = 0 ;i<newTree.children.length;i++){
           replace(newTree.children[i],oldTree.children[i], "  " + indent);
          }
        }
      }
      replace(vdom, this.oldVdom, "")
    }else{
      vdom.mountTo(this.range)
    }
    this.oldVdom = vdom
  }
  get vdom(){
    return this.render().vdom;
  }
  appendChild(vchild) {
    this.children.push(vchild)
  }
  setState(state){
    let merge = (oldState, newState) => {
      for(let p in newState) {
        if (typeof newState[p] === "object" && newState[p] !== null) {
          if (typeof oldState[p] !== "object") {
            if (newState[p] instanceof Array) {
              oldState[p] = []
            } else {
              oldState[p] = {};
            }
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
          if (child === null || child === void 0) {
            child = "";
          }
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