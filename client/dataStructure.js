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
  ["Stopping guided navigation.", 10]
  , ["car", 9]
  , ["motorcycle", 8]
  , ["person", 7]
  , ["pothole", 6]
  , ["door", 6]
  , ["cow", 5]
  , ["dog", 4]
  , ["doorhandle", 3]
  , ["traffic_cone", 2]
  , ["stairs", 1]
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