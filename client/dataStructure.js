export { QElement, PriorityQueue };

class QElement {
  constructor(element, priority) {
    this.element = element;
    this.priority = priority;
  }
}

class PriorityQueue {
  constructor() {
    this.items = [];
  }

  enqueue(objStr) {
    var qElement = getQElementFromStr(objStr);
    var added = false;

    for (var i = 0; i < this.items.length; i++) {
      if (this.items[i].priority < qElement.priority) {
        this.items.splice(i, 0, qElement);
        added = true;
        break;
      }
    }

    if (!added) {
      this.items.push(qElement);
    }
  }

  dequeue() {
    if (this.isEmpty())
      return "Underflow";
    return this.items.shift();
  }

  isEmpty() {
    return this.items.length == 0;
  }
}

let priorityOrder = [
  ["Stopping guided navigation.", 9]
  , ["car", 5]
  , ["motorcycle", 5]
  , ["person", 4]
  , ["pothole", 4]
  , ["door", 4]
  , ["cow", 2]
  , ["dog", 2]
  , ["doorhandle", 2]
  , ["traffic_cone", 2]
  , ["stairs", 2]
]

function getQElementFromStr(str) {
  for (let i = 0; i < priorityOrder.length; i++) {
    if (str == priorityOrder[i][0]) {
      return new QElement(str, priorityOrder[i][1]);
    }
  }
  console.warn("Couldn't find Element ", str, " in priorityOrder")
  return new QElement(str, 0);
}