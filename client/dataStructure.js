export { QElement, PriorityQueue };

class QElement {
  constructor(key, text, priority) {
    this.key = key;
    this.text = text;
    this.priority = priority;
  }
}

class PriorityQueue {
  constructor() {
    this.items = [];
  }

  enqueue(key, text) {
    var qElement = getQElementFromStr(key, text);
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
      return null;
    return this.items.shift();
  }

  isEmpty() {
    return this.items.length == 0;
  }

  clear(){
    this.items = [];
  }
}

let priorityOrder = [
  ["rasaResp", 10]
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

function getQElementFromStr(key, text) {
  for (let i = 0; i < priorityOrder.length; i++) {
    if (key == priorityOrder[i][0]) {
      return new QElement(key, text, priorityOrder[i][1]);
    }
  }
  console.warn("Couldn't find Element ", key, " in priorityOrder")
  return new QElement(key, text, 0);
}