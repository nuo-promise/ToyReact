import { ToyReact, Component } from "./ToyReact.js"
class MyComponent extends Component {
  render() {
    return <div>
      <span>Hello</span>
      <span>World</span>
      <div>
        {this.children}
      </div>
      cool
      </div>
  }
}
let a = <MyComponent name="a" id="ida">
  <div>123</div>
  <span>Hello World</span>
</MyComponent>
// console.log(a)
ToyReact.render(
  a,
  document.body
);

/*
var a = ToyReact.createElement("div", {
  name: "a",
  id: "ida"
},
ToyReact.createElement("span", null, "Hello"),
ToyReact.createElement("span", null, "World"),
ToyReact.createElement("span", null, "!")); // console.log(a)

document.body.appendChild(a);
*/