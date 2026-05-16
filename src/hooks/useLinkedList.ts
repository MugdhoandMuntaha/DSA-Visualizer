"use client";
import { useState, useCallback, useRef } from "react";
import { LL_CODES } from "@/lib/llCodes";

export interface LLNodeData {
  id: string;
  val: number;
  nextId: string | null;
}

export interface LLSnapshot {
  nodes: LLNodeData[];
  head: string | null;
  tail: string | null;
  pointers: Record<string, string>; // pointerName -> nodeId
  msg: string;
  activeLine: number;
  activeCodeKey: string | null;
  extraState?: any;
}

export function useLinkedList() {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [logEntries, setLogEntries] = useState<{ type: string; msg: string }[]>([]);
  const [currentState, setCurrentState] = useState<LLSnapshot>({
    nodes: [], head: null, tail: null, pointers: {}, msg: "List is empty.", activeLine: 0, activeCodeKey: null
  });

  const baseStateRef = useRef<LLSnapshot>({
    nodes: [], head: null, tail: null, pointers: {}, msg: "", activeLine: 0, activeCodeKey: null
  });

  const stepsRef = useRef<LLSnapshot[]>([]);
  const stepIdxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(5);
  const pausedRef = useRef(false);
  const runningRef = useRef(false);

  const getDelay = () => 1800 - (speedRef.current - 1) * 170;

  const buildSteps = useCallback((op: string, args: any) => {
    const steps: LLSnapshot[] = [];
    let state = JSON.parse(JSON.stringify(baseStateRef.current)) as LLSnapshot;
    state.pointers = {};
    state.activeCodeKey = op;
    state.extraState = null;

    const push = (line: number, msg: string) => {
      steps.push(JSON.parse(JSON.stringify({ ...state, activeLine: line, msg })));
    };

    const genId = () => `node-${Math.random().toString(36).substr(2, 9)}`;

    switch (op) {
      case "insertAtHead": {
        const val = args.val as number;
        push(1, `insertAtHead(${val}) called.`);
        const newNodeId = genId();
        const newNode: LLNodeData = { id: newNodeId, val, nextId: null };
        state.nodes.push(newNode);
        if (newNodeId) state.pointers["newNode"] = newNodeId; else delete state.pointers["newNode"];
        push(2, `Node* newNode = new Node(${val});`);

        push(3, `if(head == NULL) check.`);
        if (state.head === null) {
          state.head = newNodeId;
          state.tail = newNodeId;
          push(4, `List was empty. head = tail = newNode.`);
          push(5, `return;`);
        } else {
          newNode.nextId = state.head;
          push(7, `newNode->next = head;`);
          state.head = newNodeId;
          push(8, `head = newNode;`);
          push(9, `Insertion at head complete.`);
        }
        break;
      }
      case "insertAtTail": {
        const val = args.val as number;
        push(1, `insertAtTail(${val}) called.`);
        const newNodeId = genId();
        const newNode: LLNodeData = { id: newNodeId, val, nextId: null };
        state.nodes.push(newNode);
        if (newNodeId) state.pointers["newNode"] = newNodeId; else delete state.pointers["newNode"];
        push(2, `Node* newNode = new Node(${val});`);

        push(3, `if(head == NULL) check.`);
        if (state.head === null) {
          state.head = newNodeId;
          state.tail = newNodeId;
          push(4, `List was empty. head = tail = newNode.`);
          push(5, `return;`);
        } else {
          const tailNode = state.nodes.find(n => n.id === state.tail);
          if (tailNode) tailNode.nextId = newNodeId;
          push(7, `tail->next = newNode;`);
          state.tail = newNodeId;
          push(8, `tail = newNode;`);
          push(9, `Insertion at tail complete.`);
        }
        break;
      }
      case "insertAtPosition": {
        const { pos, val } = args;
        push(1, `insertAtPosition(${pos}, ${val}) called.`);
        push(2, `if(pos == 1) check.`);
        if (pos === 1) {
          push(2, `pos is 1, so routing to insertAtHead.`);
          // Simulating inline insert at head
          const nId = genId();
          state.nodes.push({ id: nId, val, nextId: state.head });
          state.head = nId;
          if (!state.tail) state.tail = nId;
          push(2, `Inserted at head.`);
          break;
        }

        let tempId = state.head;
        state.pointers["temp"] = tempId || "";
        push(3, `Node* temp = head;`);
        let cnt = 1;
        state.extraState = { cnt, pos };
        push(4, `int cnt = 1;`);

        while (cnt < pos - 1 && tempId !== null) {
          push(5, `while(cnt < pos - 1 && temp != NULL) -> true`);
          const tempNode = state.nodes.find(n => n.id === tempId);
          tempId = tempNode?.nextId || null;
          if (tempId) if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
          push(6, `temp = temp->next;`);
          cnt++;
          state.extraState = { cnt, pos };
          push(7, `cnt++;`);
        }
        push(5, `while loop exits.`);

        push(9, `if(temp == tail) check.`);
        if (tempId === state.tail) {
          push(9, `temp == tail, routing to insertAtTail.`);
          const nId = genId();
          state.nodes.push({ id: nId, val, nextId: null });
          const tailN = state.nodes.find(n => n.id === state.tail);
          if (tailN) tailN.nextId = nId;
          state.tail = nId;
          push(9, `Inserted at tail.`);
          break;
        }

        const newNodeId = genId();
        const newNode: LLNodeData = { id: newNodeId, val, nextId: null };
        state.nodes.push(newNode);
        if (newNodeId) state.pointers["newNode"] = newNodeId; else delete state.pointers["newNode"];
        push(10, `Node* newNode = new Node(${val});`);

        const tempNode = state.nodes.find(n => n.id === tempId);
        if (tempNode) {
          newNode.nextId = tempNode.nextId;
          push(11, `newNode->next = temp->next;`);
          tempNode.nextId = newNodeId;
          push(12, `temp->next = newNode;`);
        }
        push(13, `Insertion complete.`);
        break;
      }
      case "insertBeforeValue": {
        const { target, val } = args;
        push(1, `insertBeforeValue(${target}, ${val}) called.`);
        push(2, `if(head == NULL) check.`);
        if (!state.head) break;

        const hNode = state.nodes.find(n => n.id === state.head);
        push(3, `if(head->data == target) check.`);
        if (hNode?.val === target) {
          push(3, `Target is at head, route to insertAtHead.`);
          const nId = genId();
          state.nodes.push({ id: nId, val, nextId: state.head });
          state.head = nId;
          if (!state.tail) state.tail = nId;
          push(3, `Inserted at head.`);
          break;
        }

        let prevId: string | null = null;
        push(4, `Node* prev = NULL;`);
        let currId: string | null = state.head;
        if (currId) state.pointers["curr"] = currId; else delete state.pointers["curr"];
        push(5, `Node* curr = head;`);

        while (currId !== null) {
          const cNode = state.nodes.find(n => n.id === currId);
          push(6, `while(curr != NULL && curr->data != target) -> testing ${cNode?.val}`);
          if (cNode?.val === target) {
            push(6, `Target found! Exiting loop.`);
            break;
          }
          prevId = currId;
          if (prevId) state.pointers["prev"] = prevId; else delete state.pointers["prev"];
          push(7, `prev = curr;`);
          
          currId = cNode?.nextId || null;
          if (currId) if (currId) state.pointers["curr"] = currId; else delete state.pointers["curr"];
          else delete state.pointers["curr"];
          push(8, `curr = curr->next;`);
        }

        push(10, `if(curr == NULL) check.`);
        if (!currId) {
          push(10, `Target not found.`);
          break;
        }

        const newNodeId = genId();
        const newNode: LLNodeData = { id: newNodeId, val, nextId: null };
        state.nodes.push(newNode);
        if (newNodeId) state.pointers["newNode"] = newNodeId; else delete state.pointers["newNode"];
        push(11, `Node* newNode = new Node(${val});`);

        newNode.nextId = currId;
        push(12, `newNode->next = curr;`);

        const pNode = state.nodes.find(n => n.id === prevId);
        if (pNode) pNode.nextId = newNodeId;
        push(13, `prev->next = newNode;`);
        break;
      }
      case "insertAfterValue": {
        const { target, val } = args;
        push(1, `insertAfterValue(${target}, ${val}) called.`);
        let tempId: string | null = state.head;
        if (tempId) if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
        push(2, `Node* temp = head;`);

        while (tempId !== null) {
          const tNode = state.nodes.find(n => n.id === tempId);
          push(3, `while(temp != NULL && temp->data != target) -> testing ${tNode?.val}`);
          if (tNode?.val === target) {
            push(3, `Target found! Exiting loop.`);
            break;
          }
          tempId = tNode?.nextId || null;
          if (tempId) if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
          else delete state.pointers["temp"];
          push(4, `temp = temp->next;`);
        }

        push(6, `if(temp == NULL) check.`);
        if (!tempId) {
          push(6, `Target not found.`);
          break;
        }

        const newNodeId = genId();
        const newNode: LLNodeData = { id: newNodeId, val, nextId: null };
        state.nodes.push(newNode);
        if (newNodeId) state.pointers["newNode"] = newNodeId; else delete state.pointers["newNode"];
        push(7, `Node* newNode = new Node(${val});`);

        const tNode = state.nodes.find(n => n.id === tempId);
        if (tNode) newNode.nextId = tNode.nextId;
        push(8, `newNode->next = temp->next;`);

        if (tNode) tNode.nextId = newNodeId;
        push(9, `temp->next = newNode;`);

        push(10, `if(temp == tail) check.`);
        if (tempId === state.tail) {
          state.tail = newNodeId;
          push(10, `tail = newNode;`);
        }
        break;
      }
      case "insertSorted": {
        const val = args.val as number;
        push(1, `insertSorted(${val}) called.`);

        const newNodeId = genId();
        const newNode: LLNodeData = { id: newNodeId, val, nextId: null };
        state.nodes.push(newNode);
        if (newNodeId) state.pointers["newNode"] = newNodeId; else delete state.pointers["newNode"];
        push(2, `Node* newNode = new Node(${val});`);

        const hNode = state.head ? state.nodes.find(n => n.id === state.head) : null;
        push(3, `if(head == NULL || head->data >= data) check.`);
        if (state.head === null || (hNode && hNode.val >= val)) {
          newNode.nextId = state.head;
          push(4, `newNode->next = head;`);
          state.head = newNodeId;
          push(5, `head = newNode;`);
          if (state.tail === null) {
            state.tail = newNodeId;
            push(6, `if(tail == NULL) tail = newNode;`);
          }
          push(7, `return;`);
          break;
        }

        let currId: string | null = state.head;
        if (currId) state.pointers["curr"] = currId; else delete state.pointers["curr"];
        push(9, `Node* curr = head;`);

        while (currId !== null) {
          const cNode = state.nodes.find(n => n.id === currId);
          const nextNode = cNode?.nextId ? state.nodes.find(n => n.id === cNode!.nextId) : null;
          push(10, `while(curr->next != NULL && curr->next->data < data) check.`);
          if (!cNode?.nextId || (nextNode && nextNode.val >= val)) {
            push(10, `Condition false. Stop.`);
            break;
          }
          currId = cNode?.nextId || null;
          if (currId) if (currId) state.pointers["curr"] = currId; else delete state.pointers["curr"];
          push(11, `curr = curr->next;`);
        }

        const cNode = state.nodes.find(n => n.id === currId);
        if (cNode) newNode.nextId = cNode.nextId;
        push(13, `newNode->next = curr->next;`);

        if (cNode) cNode.nextId = newNodeId;
        push(14, `curr->next = newNode;`);

        push(15, `if(newNode->next == NULL) check.`);
        if (newNode.nextId === null) {
          state.tail = newNodeId;
          push(15, `tail = newNode;`);
        }
        break;
      }
      case "insertRecursive": {
        const { pos, val } = args;
        push(10, `insertRecursive(${pos}, ${val}) called.`);

        // Simulate the recursive descent iteratively but show call stack
        const callStack: { nodeId: string | null; pos: number; depth: number }[] = [];
        let nodeId: string | null = state.head;
        let curPos = pos;
        let depth = 0;

        // Descend
        while (curPos > 1 && nodeId !== null) {
          callStack.push({ nodeId, pos: curPos, depth });
          const nd = state.nodes.find(n => n.id === nodeId);
          push(1, `insertRecursiveUtil(node=${nd?.val}, pos=${curPos}, data=${val})`);
          push(2, `if(pos == 1 || node == NULL) -> false`);
          push(7, `node->next = insertRecursiveUtil(node->next, ${curPos - 1}, ${val});`);
          if (nodeId) state.pointers[`frame${depth}`] = nodeId;
          nodeId = nd?.nextId || null;
          curPos--;
          depth++;
        }

        // Base case: insert
        push(1, `insertRecursiveUtil(node=${nodeId ? state.nodes.find(n => n.id === nodeId)?.val : "NULL"}, pos=${curPos}, data=${val})`);
        push(2, `if(pos == 1 || node == NULL) -> true`);
        const newNodeId = genId();
        const newNode: LLNodeData = { id: newNodeId, val, nextId: nodeId };
        state.nodes.push(newNode);
        if (newNodeId) state.pointers["newNode"] = newNodeId; else delete state.pointers["newNode"];
        push(3, `Node* newNode = new Node(${val});`);
        push(4, `newNode->next = node;`);
        push(5, `return newNode;`);

        // Unwind: connect parent nodes
        let childId: string | null = newNodeId;
        for (let i = callStack.length - 1; i >= 0; i--) {
          const frame = callStack[i];
          const parentNode = state.nodes.find(n => n.id === frame.nodeId);
          if (parentNode && childId) parentNode.nextId = childId;
          push(7, `Returning up: node(${parentNode?.val})->next = ${val}`);
          push(8, `return node;`);
          childId = frame.nodeId;
          delete state.pointers[`frame${frame.depth}`];
        }

        // Final: head = result
        if (callStack.length === 0) {
          state.head = newNodeId;
        }
        push(11, `head = insertRecursiveUtil(head, ${pos}, ${val});`);

        // Update tail
        let t: string | null = state.head;
        let lastId: string | null = t;
        while (t) {
          lastId = t;
          const nd = state.nodes.find(n => n.id === t);
          t = nd?.nextId || null;
        }
        state.tail = lastId;
        break;
      }
      case "pushFront": {
        const val = args.val as number;
        push(1, `pushFront(${val}) called.`);
        const newNodeId = genId();
        const newNode: LLNodeData = { id: newNodeId, val, nextId: null };
        state.nodes.push(newNode);
        if (newNodeId) state.pointers["newNode"] = newNodeId; else delete state.pointers["newNode"];
        push(2, `Node* newNode = new Node(${val});`);

        push(3, `if(head == NULL) check.`);
        if (state.head === null) {
          state.head = newNodeId;
          state.tail = newNodeId;
          push(4, `head = tail = newNode;`);
          push(5, `return;`);
        } else {
          newNode.nextId = state.head;
          push(7, `newNode->next = head;`);
          state.head = newNodeId;
          push(8, `head = newNode;`);
        }
        break;
      }
      case "pushBack": {
        const val = args.val as number;
        push(1, `pushBack(${val}) called.`);
        const newNodeId = genId();
        const newNode: LLNodeData = { id: newNodeId, val, nextId: null };
        state.nodes.push(newNode);
        if (newNodeId) state.pointers["newNode"] = newNodeId; else delete state.pointers["newNode"];
        push(2, `Node* newNode = new Node(${val});`);

        push(3, `if(head == NULL) check.`);
        if (state.head === null) {
          state.head = newNodeId;
          state.tail = newNodeId;
          push(4, `head = tail = newNode;`);
          push(5, `return;`);
        } else {
          const tailNode = state.nodes.find(n => n.id === state.tail);
          if (tailNode) tailNode.nextId = newNodeId;
          push(7, `tail->next = newNode;`);
          state.tail = newNodeId;
          push(8, `tail = newNode;`);
        }
        break;
      }
      case "deleteHead": {
        push(1, `deleteHead() called.`);
        push(2, `if(head == NULL) check.`);
        if (state.head === null) {
          push(2, `List empty. Return.`);
          break;
        }
        state.pointers["temp"] = state.head;
        push(3, `Node* temp = head;`);
        
        const hNode = state.nodes.find(n => n.id === state.head);
        state.head = hNode?.nextId || null;
        if (state.head === null) state.tail = null;
        push(4, `head = head->next;`);

        state.nodes = state.nodes.filter(n => n.id !== state.pointers["temp"]);
        delete state.pointers["temp"];
        push(5, `delete temp;`);
        break;
      }
      case "deleteTail": {
        push(1, `deleteTail() called.`);
        push(2, `if(head == NULL) check.`);
        if (state.head === null) break;

        push(3, `if(head == tail) check.`);
        if (state.head === state.tail) {
          push(4, `Only one node present.`);
          state.nodes = [];
          state.head = null; state.tail = null;
          push(5, `head = tail = NULL; return;`);
          break;
        }

        state.pointers["temp"] = state.head;
        let tempId: string | null = state.head;
        push(8, `Node* temp = head;`);

        while (tempId !== null) {
          const tNode = state.nodes.find(n => n.id === tempId);
          push(9, `while(temp->next != tail) check.`);
          if (tNode?.nextId === state.tail) {
            push(9, `Condition false, temp->next is tail.`);
            break;
          }
          tempId = tNode?.nextId || null;
          if (tempId) if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
          push(10, `temp = temp->next;`);
        }

        const tailIdToRemove = state.tail;
        state.nodes = state.nodes.filter(n => n.id !== tailIdToRemove);
        push(12, `delete tail;`);
        
        state.tail = tempId;
        push(13, `tail = temp;`);
        
        const newTailNode = state.nodes.find(n => n.id === state.tail);
        if (newTailNode) newTailNode.nextId = null;
        push(14, `tail->next = NULL;`);
        break;
      }
      case "deleteByValue": {
        const val = args.val;
        push(1, `deleteByValue(${val}) called.`);
        push(2, `if(head == NULL) check.`);
        if (!state.head) break;

        const hNode = state.nodes.find(n => n.id === state.head);
        push(3, `if(head->data == value) check.`);
        if (hNode?.val === val) {
          push(3, `Value found at head. Routing to deleteHead.`);
          state.head = hNode!.nextId;
          if (!state.head) state.tail = null;
          state.nodes = state.nodes.filter(n => n.id !== hNode!.id);
          push(3, `Head deleted.`);
          break;
        }

        state.pointers["prev"] = "NULL";
        push(4, `Node* prev = NULL;`);
        state.pointers["curr"] = state.head;
        let currId: string | null = state.head;
        let prevId: string | null = null;
        push(5, `Node* curr = head;`);

        while (currId !== null) {
          const cNode = state.nodes.find(n => n.id === currId);
          push(6, `while(curr != NULL && curr->data != value) -> testing ${cNode?.val}`);
          if (cNode?.val === val) {
            push(6, `Value found! Exiting loop.`);
            break;
          }
          prevId = currId;
          if (prevId) if (prevId) state.pointers["prev"] = prevId; else delete state.pointers["prev"];
          push(7, `prev = curr;`);

          currId = cNode?.nextId || null;
          if (currId) if (currId) state.pointers["curr"] = currId; else delete state.pointers["curr"];
          else delete state.pointers["curr"];
          push(8, `curr = curr->next;`);
        }

        push(10, `if(curr == NULL) check.`);
        if (currId === null) {
          push(10, `Value not found. Returning.`);
          break;
        }

        const pNode = state.nodes.find(n => n.id === prevId);
        const cNode = state.nodes.find(n => n.id === currId);
        if (pNode && cNode) pNode.nextId = cNode.nextId;
        push(11, `prev->next = curr->next;`);

        push(12, `if(curr == tail) check.`);
        if (currId === state.tail) {
          state.tail = prevId;
          push(12, `tail = prev;`);
        }

        state.nodes = state.nodes.filter(n => n.id !== currId);
        push(13, `delete curr;`);
        break;
      }
      case "deleteAtPosition": {
        const pos = args.pos as number;
        push(1, `deleteAtPosition(${pos}) called.`);
        push(2, `if(head == NULL || pos <= 0) check.`);
        if (state.head === null || pos <= 0) break;

        push(3, `if(pos == 1) check.`);
        if (pos === 1) {
          push(3, `Delegating to deleteHead().`);
          const hNode = state.nodes.find(n => n.id === state.head);
          state.head = hNode?.nextId || null;
          if (state.head === null) state.tail = null;
          state.nodes = state.nodes.filter(n => n.id !== hNode?.id);
          break;
        }

        let tempId: string | null = state.head;
        if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
        push(4, `Node* temp = head;`);

        let currentPos = 1;
        while (currentPos < pos - 1 && tempId !== null) {
          const tNode = state.nodes.find(n => n.id === tempId);
          push(5, `for loop check.`);
          if (tNode?.nextId === null) {
            push(5, `temp->next is NULL, break.`);
            break;
          }
          tempId = tNode?.nextId || null;
          if (tempId) if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
          push(5, `temp = temp->next;`);
          currentPos++;
        }

        const tNode = state.nodes.find(n => n.id === tempId);
        push(6, `if(temp->next == NULL) check.`);
        if (!tNode || tNode.nextId === null) break;

        const delId = tNode.nextId;
        if (delId) state.pointers["del"] = delId; else delete state.pointers["del"];
        push(7, `Node* del = temp->next;`);

        const dNode = state.nodes.find(n => n.id === delId);
        tNode.nextId = dNode?.nextId || null;
        push(8, `temp->next = del->next;`);

        push(9, `if(del == tail) check.`);
        if (delId === state.tail) {
          state.tail = tempId;
          push(9, `tail = temp;`);
        }

        state.nodes = state.nodes.filter(n => n.id !== delId);
        delete state.pointers["del"];
        push(10, `delete del;`);
        break;
      }
      case "deleteBeforeNode": {
        const target = args.target;
        push(1, `deleteBeforeNode(${target}) called.`);
        push(2, `if(head == NULL || head->data == target) check.`);
        const hNode = state.nodes.find(n => n.id === state.head);
        if (state.head === null || hNode?.val === target) break;

        let prevId: string | null = null;
        state.pointers["prev"] = "NULL";
        push(3, `Node* prev = NULL;`);
        let currId: string | null = state.head;
        if (currId) state.pointers["curr"] = currId; else delete state.pointers["curr"];
        push(4, `Node* curr = head;`);

        while (currId !== null) {
          const cNode = state.nodes.find(n => n.id === currId);
          const nextNode = cNode?.nextId ? state.nodes.find(n => n.id === cNode.nextId) : null;
          push(5, `while(curr->next != NULL && curr->next->data != target) check.`);
          if (!cNode?.nextId || nextNode?.val === target) break;

          prevId = currId;
          if (prevId) state.pointers["prev"] = prevId; else delete state.pointers["prev"];
          push(6, `prev = curr;`);
          currId = cNode?.nextId || null;
          if (currId) if (currId) state.pointers["curr"] = currId; else delete state.pointers["curr"];
          push(7, `curr = curr->next;`);
        }

        const cNode = state.nodes.find(n => n.id === currId);
        push(9, `if(curr->next == NULL) check.`);
        if (!cNode || cNode.nextId === null) break;

        push(10, `if(prev == NULL) check.`);
        if (prevId === null) {
          push(11, `deleteHead();`);
          const h = state.nodes.find(n => n.id === state.head);
          state.head = h?.nextId || null;
          if (state.head === null) state.tail = null;
          state.nodes = state.nodes.filter(n => n.id !== h?.id);
        } else {
          const pNode = state.nodes.find(n => n.id === prevId);
          pNode!.nextId = cNode.nextId;
          push(13, `prev->next = curr->next;`);
          push(14, `if(curr == tail) check.`);
          if (currId === state.tail) {
            state.tail = prevId;
            push(14, `tail = prev;`);
          }
          state.nodes = state.nodes.filter(n => n.id !== currId);
          push(15, `delete curr;`);
        }
        break;
      }
      case "deleteAfterNode": {
        const target = args.target;
        push(1, `deleteAfterNode(${target}) called.`);
        let tempId: string | null = state.head;
        if (tempId) if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
        push(2, `Node* temp = head;`);

        while (tempId !== null) {
          const tNode = state.nodes.find(n => n.id === tempId);
          push(3, `while(temp != NULL && temp->data != target) check.`);
          if (tNode?.val === target) break;
          tempId = tNode?.nextId || null;
          if (tempId) if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
          push(3, `temp = temp->next;`);
        }

        const tNode = state.nodes.find(n => n.id === tempId);
        push(4, `if(temp == NULL || temp->next == NULL) check.`);
        if (!tNode || tNode.nextId === null) break;

        const delId = tNode.nextId;
        if (delId) state.pointers["del"] = delId; else delete state.pointers["del"];
        push(5, `Node* del = temp->next;`);

        const dNode = state.nodes.find(n => n.id === delId);
        tNode.nextId = dNode?.nextId || null;
        push(6, `temp->next = del->next;`);

        push(7, `if(del == tail) check.`);
        if (delId === state.tail) {
          state.tail = tempId;
          push(7, `tail = temp;`);
        }

        state.nodes = state.nodes.filter(n => n.id !== delId);
        delete state.pointers["del"];
        push(8, `delete del;`);
        break;
      }
      case "deleteEntireList": {
        push(1, `deleteEntireList() called.`);
        while (state.head !== null) {
          push(2, `while(head != NULL) check.`);
          let tempId = state.head;
          if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
          push(3, `Node* temp = head;`);
          const hNode = state.nodes.find(n => n.id === state.head);
          state.head = hNode?.nextId || null;
          push(4, `head = head->next;`);
          state.nodes = state.nodes.filter(n => n.id !== tempId);
          push(5, `delete temp;`);
        }
        push(2, `while(head != NULL) check. false.`);
        state.tail = null;
        push(7, `tail = NULL;`);
        break;
      }
      case "recursiveDelete": {
        const target = args.target;
        push(11, `recursiveDelete(${target}) called.`);
        const callStack: { nodeId: string | null; depth: number }[] = [];
        let nodeId: string | null = state.head;
        let depth = 0;

        while (nodeId !== null) {
          callStack.push({ nodeId, depth });
          const nd = state.nodes.find(n => n.id === nodeId);
          push(1, `recursiveDeleteUtil(node=${nd?.val}, target=${target})`);
          push(2, `if(node == NULL) check.`);
          push(3, `if(node->data == target) check.`);
          if (nd?.val === target) {
            push(4, `Node* nxt = node->next;`);
            if (nd?.nextId) state.pointers[`nxt`] = nd.nextId;
            else delete state.pointers[`nxt`];
            push(5, `delete node;`);
            state.nodes = state.nodes.filter(n => n.id !== nodeId);
            push(6, `return recursiveDeleteUtil(nxt, target);`);
            nodeId = nd?.nextId || null;
            depth++;
          } else {
            push(8, `node->next = recursiveDeleteUtil(node->next, target);`);
            if (nodeId) state.pointers[`frame${depth}`] = nodeId;
            nodeId = nd?.nextId || null;
            depth++;
          }
        }
        push(1, `recursiveDeleteUtil(node=NULL, target=${target})`);
        push(2, `if(node == NULL) check.`);
        push(2, `return NULL;`);

        let childId: string | null = null;
        for (let i = callStack.length - 1; i >= 0; i--) {
          const frame = callStack[i];
          const parentNode = state.nodes.find(n => n.id === frame.nodeId);
          if (parentNode) {
            parentNode.nextId = childId;
            push(9, `return node;`);
            childId = frame.nodeId;
            delete state.pointers[`frame${frame.depth}`];
          } else {
            // Node was deleted
            push(6, `return recursiveDeleteUtil...`);
          }
        }

        state.head = childId;
        push(12, `head = recursiveDeleteUtil(head, target);`);
        let t = state.head;
        let lastId = t;
        while (t) {
          lastId = t;
          const nd = state.nodes.find(n => n.id === t);
          t = nd?.nextId || null;
        }
        state.tail = lastId;
        push(16, `while(t){ tail = t; t = t->next; }`);
        break;
      }
      case "popFront": {
        push(1, `popFront() called.`);
        push(1, `deleteHead();`);
        if (state.head !== null) {
          const hNode = state.nodes.find(n => n.id === state.head);
          state.head = hNode?.nextId || null;
          if (state.head === null) state.tail = null;
          state.nodes = state.nodes.filter(n => n.id !== hNode?.id);
        }
        break;
      }
      case "popBack": {
        push(1, `popBack() called.`);
        push(1, `deleteTail();`);
        if (state.head !== null) {
          if (state.head === state.tail) {
            state.nodes = [];
            state.head = null; state.tail = null;
          } else {
            let tempId: string | null = state.head;
            while (tempId !== null) {
              const tNode = state.nodes.find(n => n.id === tempId);
              if (tNode?.nextId === state.tail) break;
              tempId = tNode?.nextId || null;
            }
            state.nodes = state.nodes.filter(n => n.id !== state.tail);
            state.tail = tempId;
            const newTailNode = state.nodes.find(n => n.id === state.tail);
            if (newTailNode) newTailNode.nextId = null;
          }
        }
        break;
      }
      case "deleteNthFromEnd": {
        const n = args.val;
        push(1, `deleteNthFromEnd(${n}) called.`);
        let fastId: string | null = state.head;
        if (fastId) state.pointers["fast"] = fastId; else delete state.pointers["fast"];
        push(2, `Node* fast = head;`);

        let i = 0;
        while (i < n && fastId !== null) {
          const fNode = state.nodes.find(node => node.id === fastId);
          fastId = fNode?.nextId || null;
          if (fastId) if (fastId) state.pointers["fast"] = fastId; else delete state.pointers["fast"];
          push(3, `for(...) fast = fast->next;`);
          i++;
        }

        push(4, `if(!fast) check.`);
        if (!fastId) {
          push(5, `deleteHead(); return;`);
          if (state.head !== null) {
            const hNode = state.nodes.find(n => n.id === state.head);
            state.head = hNode?.nextId || null;
            if (state.head === null) state.tail = null;
            state.nodes = state.nodes.filter(node => node.id !== hNode?.id);
          }
          break;
        }

        let slowId: string | null = state.head;
        if (slowId) state.pointers["slow"] = slowId; else delete state.pointers["slow"];
        push(6, `Node* slow = head;`);

        while (fastId !== null) {
          const fNode = state.nodes.find(node => node.id === fastId);
          push(7, `while(fast->next) check.`);
          if (fNode?.nextId === null) break;
          fastId = fNode?.nextId || null;
          if (fastId) if (fastId) state.pointers["fast"] = fastId; else delete state.pointers["fast"];

          const sNode = state.nodes.find(node => node.id === slowId);
          slowId = sNode?.nextId || null;
          if (slowId) if (slowId) state.pointers["slow"] = slowId; else delete state.pointers["slow"];
          push(7, `fast = fast->next; slow = slow->next;`);
        }

        const sNode = state.nodes.find(node => node.id === slowId);
        if (!sNode) break;

        const delId = sNode.nextId;
        if (!delId) break;
        if (delId) state.pointers["del"] = delId; else delete state.pointers["del"];
        push(8, `Node* del = slow->next;`);

        const dNode = state.nodes.find(node => node.id === delId);
        sNode.nextId = dNode?.nextId || null;
        push(9, `slow->next = del->next;`);

        push(10, `if(del == tail) check.`);
        if (delId === state.tail) {
          state.tail = slowId;
          push(10, `tail = slow;`);
        }

        state.nodes = state.nodes.filter(node => node.id !== delId);
        delete state.pointers["del"];
        push(11, `delete del;`);
        break;
      }
      case "deleteMiddleNode": {
        push(1, `deleteMiddleNode() called.`);
        push(2, `if(head == NULL || head->next == NULL) check.`);
        if (state.head === null) break;
        const hNode = state.nodes.find(n => n.id === state.head);
        if (hNode?.nextId === null) break;

        let slowId: string | null = state.head;
        if (slowId) state.pointers["slow"] = slowId; else delete state.pointers["slow"];
        push(3, `Node* slow = head;`);
        let fastId: string | null = state.head;
        if (fastId) state.pointers["fast"] = fastId; else delete state.pointers["fast"];
        push(4, `Node* fast = head;`);
        let prevId: string | null = null;
        state.pointers["prev"] = "NULL";
        push(5, `Node* prev = NULL;`);

        while (fastId !== null) {
          const fNode = state.nodes.find(n => n.id === fastId);
          push(6, `while(fast && fast->next) check.`);
          if (!fNode?.nextId) break;
          
          const fNextNode = state.nodes.find(n => n.id === fNode.nextId);
          fastId = fNextNode?.nextId || null;
          if (fastId) if (fastId) state.pointers["fast"] = fastId; else delete state.pointers["fast"];
          else delete state.pointers["fast"];
          push(7, `fast = fast->next->next;`);

          prevId = slowId;
          if (prevId) if (prevId) state.pointers["prev"] = prevId; else delete state.pointers["prev"];
          push(8, `prev = slow;`);

          const sNode = state.nodes.find(n => n.id === slowId);
          slowId = sNode?.nextId || null;
          if (slowId) if (slowId) state.pointers["slow"] = slowId; else delete state.pointers["slow"];
          push(9, `slow = slow->next;`);
        }

        push(11, `if(prev) prev->next = slow->next;`);
        const pNode = state.nodes.find(n => n.id === prevId);
        const sNode = state.nodes.find(n => n.id === slowId);
        if (pNode && sNode) {
          pNode.nextId = sNode.nextId;
        }

        push(12, `if(slow == tail) tail = prev;`);
        if (slowId === state.tail) {
          state.tail = prevId;
        }

        state.nodes = state.nodes.filter(n => n.id !== slowId);
        push(13, `delete slow;`);
        break;
      }
      case "deleteAlternateNodes": {
        push(1, `deleteAlternateNodes() called.`);
        let currId: string | null = state.head;
        if (currId) if (currId) state.pointers["curr"] = currId; else delete state.pointers["curr"];
        push(2, `Node* curr = head;`);

        while (currId !== null) {
          const cNode = state.nodes.find(n => n.id === currId);
          push(3, `while(curr && curr->next) check.`);
          if (!cNode?.nextId) break;

          const delId = cNode.nextId;
          if (delId) state.pointers["del"] = delId; else delete state.pointers["del"];
          push(4, `Node* del = curr->next;`);

          const dNode = state.nodes.find(n => n.id === delId);
          cNode.nextId = dNode?.nextId || null;
          push(5, `curr->next = del->next;`);

          push(6, `if(del == tail) check.`);
          if (delId === state.tail) {
            state.tail = currId;
            push(6, `tail = curr;`);
          }

          state.nodes = state.nodes.filter(n => n.id !== delId);
          delete state.pointers["del"];
          push(7, `delete del;`);

          currId = cNode.nextId;
          if (currId) if (currId) state.pointers["curr"] = currId; else delete state.pointers["curr"];
          else delete state.pointers["curr"];
          push(8, `curr = curr->next;`);
        }
        break;
      }
      case "search": {
        const val = args.val;
        push(1, `search(${val}) called.`);
        let tempId: string | null = state.head;
        if (tempId) if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
        push(2, `Node* temp = head;`);

        while (tempId !== null) {
          const tNode = state.nodes.find(n => n.id === tempId);
          push(3, `while(temp != NULL) -> true`);
          push(5, `if(temp->data == key) check (${tNode?.val} == ${val})`);
          if (tNode?.val === val) {
            push(6, `Found! return true;`);
            break;
          }
          tempId = tNode?.nextId || null;
          if (tempId) if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
          else delete state.pointers["temp"];
          push(8, `temp = temp->next;`);
        }
        if (tempId === null) push(11, `Not found. return false;`);
        break;
      }
      case "linearSearch": {
        const val = args.val;
        push(1, `linearSearch(${val}) called.`);
        let tempId: string | null = state.head;
        if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
        push(2, `Node* temp = head;`);

        while (tempId !== null) {
          const tNode = state.nodes.find(n => n.id === tempId);
          push(3, `while(temp != NULL) -> true`);
          push(4, `if(temp->data == key) check (${tNode?.val} == ${val})`);
          if (tNode?.val === val) {
            push(4, `Found! return true;`);
            break;
          }
          tempId = tNode?.nextId || null;
          if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
          push(5, `temp = temp->next;`);
        }
        if (tempId === null) push(7, `Not found. return false;`);
        break;
      }
      case "recursiveSearch": {
        const val = args.val;
        push(6, `recursiveSearch(${val}) called.`);
        let nodeId: string | null = state.head;
        let depth = 0;
        
        while (nodeId !== null) {
          const nd = state.nodes.find(n => n.id === nodeId);
          if (nodeId) state.pointers[`frame${depth}`] = nodeId; else delete state.pointers[`frame${depth}`];
          push(1, `recursiveSearchUtil(node=${nd?.val}, key=${val})`);
          push(2, `if(node == NULL) check.`);
          push(3, `if(node->data == key) check.`);
          if (nd?.val === val) {
            push(3, `Found! return true;`);
            break;
          }
          push(4, `return recursiveSearchUtil...`);
          nodeId = nd?.nextId || null;
          delete state.pointers[`frame${depth}`];
          depth++;
        }
        if (nodeId === null) {
          push(1, `recursiveSearchUtil(node=NULL, key=${val})`);
          push(2, `if(node == NULL) check. return false;`);
        }
        break;
      }
      case "searchByPosition": {
        const pos = args.pos;
        push(1, `searchByPosition(${pos}) called.`);
        push(2, `if(pos <= 0) check.`);
        if (pos <= 0) {
          push(2, `return -1;`);
          break;
        }
        let tempId: string | null = state.head;
        if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
        push(3, `Node* temp = head;`);
        push(4, `int currentPos = 1;`);
        
        let currentPos = 1;
        while (tempId !== null) {
          push(5, `while(temp != NULL) -> true`);
          push(6, `if(currentPos == pos) check (${currentPos} == ${pos})`);
          if (currentPos === pos) {
            const tNode = state.nodes.find(n => n.id === tempId);
            push(6, `Found! return ${tNode?.val};`);
            break;
          }
          const tNode = state.nodes.find(n => n.id === tempId);
          tempId = tNode?.nextId || null;
          if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
          push(7, `temp = temp->next;`);
          currentPos++;
          push(8, `currentPos++;`);
        }
        if (tempId === null) {
          push(10, `Not found. return -1;`);
        }
        break;
      }
      case "searchLastOccurrence": {
        const val = args.val;
        push(1, `searchLastOccurrence(${val}) called.`);
        let tempId: string | null = state.head;
        if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
        push(2, `Node* temp = head;`);
        push(3, `int lastPos = -1;`);
        push(4, `int currentPos = 1;`);
        
        let lastPos = -1;
        let currentPos = 1;
        let lastFoundId: string | null = null;
        
        while (tempId !== null) {
          push(5, `while(temp != NULL) -> true`);
          const tNode = state.nodes.find(n => n.id === tempId);
          push(6, `if(temp->data == key) check (${tNode?.val} == ${val})`);
          if (tNode?.val === val) {
            lastPos = currentPos;
            lastFoundId = tempId;
            push(6, `lastPos = currentPos; (${lastPos})`);
            if (lastFoundId) state.pointers["last"] = lastFoundId; else delete state.pointers["last"];
          }
          tempId = tNode?.nextId || null;
          if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
          push(7, `temp = temp->next;`);
          currentPos++;
          push(8, `currentPos++;`);
        }
        push(10, `return lastPos; (${lastPos})`);
        delete state.pointers["last"];
        break;
      }
      case "countNodes": {
        push(1, `countNodes() called.`);
        let cnt = 0;
        state.extraState = { cnt };
        push(2, `int cnt = 0;`);
        
        let tempId: string | null = state.head;
        if (tempId) if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
        push(3, `Node* temp = head;`);

        while (tempId !== null) {
          push(5, `while(temp != NULL) -> true`);
          cnt++;
          state.extraState = { cnt };
          push(6, `cnt++;`);
          const tNode = state.nodes.find(n => n.id === tempId);
          tempId = tNode?.nextId || null;
          if (tempId) if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
          else delete state.pointers["temp"];
          push(7, `temp = temp->next;`);
        }
        push(10, `return cnt; (${cnt})`);
        break;
      }
      case "reverseIterative": {
        push(1, `reverseIterative() called.`);
        let prevId: string | null = null;
        push(2, `Node* prev = NULL;`);
        let currId: string | null = state.head;
        if (currId) if (currId) state.pointers["curr"] = currId; else delete state.pointers["curr"];
        push(3, `Node* curr = head;`);
        let forwardId: string | null = null;
        push(4, `Node* forward = NULL;`);
        
        state.tail = state.head;
        push(5, `tail = head;`);

        while (currId !== null) {
          push(7, `while(curr != NULL) -> true`);
          const cNode = state.nodes.find(n => n.id === currId);
          forwardId = cNode?.nextId || null;
          if (forwardId) if (forwardId) state.pointers["forward"] = forwardId; else delete state.pointers["forward"];
          else delete state.pointers["forward"];
          push(9, `forward = curr->next;`);

          if (cNode) cNode.nextId = prevId;
          push(10, `curr->next = prev;`);

          prevId = currId;
          if (prevId) state.pointers["prev"] = prevId; else delete state.pointers["prev"];
          push(11, `prev = curr;`);

          currId = forwardId;
          if (currId) if (currId) state.pointers["curr"] = currId; else delete state.pointers["curr"];
          else delete state.pointers["curr"];
          push(12, `curr = forward;`);
        }

        state.head = prevId;
        push(14, `head = prev;`);
        break;
      }
      case "middleNode": {
        push(1, `middleNode() called.`);
        push(2, `if(head == NULL) check.`);
        if (!state.head) break;

        let slowId: string | null = state.head;
        if (slowId) state.pointers["slow"] = slowId; else delete state.pointers["slow"];
        push(4, `Node* slow = head;`);
        let fastId: string | null = state.head;
        if (fastId) state.pointers["fast"] = fastId; else delete state.pointers["fast"];
        push(5, `Node* fast = head;`);

        while (fastId !== null) {
          const fNode = state.nodes.find(n => n.id === fastId);
          push(7, `while(fast != NULL && fast->next != NULL) check.`);
          if (fNode?.nextId === null) {
            push(7, `fast->next is NULL. Loop ends.`);
            break;
          }
          const sNode = state.nodes.find(n => n.id === slowId);
          slowId = sNode?.nextId || null;
          if (slowId) if (slowId) state.pointers["slow"] = slowId; else delete state.pointers["slow"];
          push(9, `slow = slow->next;`);

          const nextFNode = state.nodes.find(n => n.id === fNode?.nextId);
          fastId = nextFNode?.nextId || null;
          if (fastId) if (fastId) state.pointers["fast"] = fastId; else delete state.pointers["fast"];
          else delete state.pointers["fast"];
          push(10, `fast = fast->next->next;`);
        }
        push(13, `return slow;`);
        break;
      }
      case "removeDuplicates": {
        push(1, `removeDuplicates() called.`);
        const st = new Set<number>();
        state.extraState = { set: Array.from(st) };
        push(2, `unordered_set<int> st;`);

        let currId: string | null = state.head;
        if (currId) if (currId) state.pointers["curr"] = currId; else delete state.pointers["curr"];
        push(4, `Node* curr = head;`);
        let prevId: string | null = null;
        push(5, `Node* prev = NULL;`);

        while (currId !== null) {
          push(7, `while(curr != NULL) -> true`);
          const cNode = state.nodes.find(n => n.id === currId);
          const val = cNode!.val;
          
          push(9, `if(st.find(curr->data) != st.end()) check for ${val}.`);
          if (st.has(val)) {
            push(9, `Duplicate found!`);
            const pNode = state.nodes.find(n => n.id === prevId);
            if (pNode) pNode.nextId = cNode!.nextId;
            push(11, `prev->next = curr->next;`);
            
            state.nodes = state.nodes.filter(n => n.id !== currId);
            push(12, `delete curr;`);

            currId = pNode?.nextId || null;
            if (currId) if (currId) state.pointers["curr"] = currId; else delete state.pointers["curr"];
            else delete state.pointers["curr"];
            push(13, `curr = prev->next;`);

            if (currId === null) {
               state.tail = prevId; // Adjust tail if we deleted the last node
            }
          } else {
            push(14, `else -> Not a duplicate.`);
            st.add(val);
            state.extraState = { set: Array.from(st) };
            push(16, `st.insert(curr->data);`);

            prevId = currId;
            if (prevId) state.pointers["prev"] = prevId; else delete state.pointers["prev"];
            push(17, `prev = curr;`);

            currId = cNode?.nextId || null;
            if (currId) if (currId) state.pointers["curr"] = currId; else delete state.pointers["curr"];
            else delete state.pointers["curr"];
            push(18, `curr = curr->next;`);
          }
        }
        push(21, `removeDuplicates complete.`);
        break;
      }
      case "isPalindrome": {
        push(1, `isPalindrome() called.`);
        const arr: number[] = [];
        state.extraState = { arr, i: -1, j: -1 };
        push(2, `vector<int> arr;`);

        let tempId: string | null = state.head;
        if (tempId) if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
        push(4, `Node* temp = head;`);

        while (tempId !== null) {
          push(6, `while(temp != NULL) -> true`);
          const tNode = state.nodes.find(n => n.id === tempId);
          arr.push(tNode!.val);
          state.extraState = { arr: [...arr], i: -1, j: -1 };
          push(7, `arr.push_back(temp->data);`);

          tempId = tNode?.nextId || null;
          if (tempId) if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
          else delete state.pointers["temp"];
          push(8, `temp = temp->next;`);
        }

        let i = 0;
        let j = arr.length - 1;
        state.extraState = { arr: [...arr], i, j };
        push(11, `int i = 0;`);
        push(12, `int j = arr.size() - 1;`);

        delete state.pointers["temp"];

        while (i < j) {
          push(14, `while(i < j) -> ${i} < ${j}`);
          push(16, `if(arr[i] != arr[j]) check: ${arr[i]} != ${arr[j]}`);
          if (arr[i] !== arr[j]) {
            push(17, `Mismatch found! return false;`);
            break;
          }
          i++;
          j--;
          state.extraState = { arr: [...arr], i, j };
          push(20, `i++; j--;`);
        }
        if (i >= j) push(23, `Loop finished. return true; (Is a Palindrome)`);
        break;
      }
      // You can add detectCycle, kReverse, recursiveReverse easily by expanding this later!
      default:
        push(1, `${op} is not fully simulated line-by-line yet.`);
        break;
    }

    state.pointers = {}; // clear pointers at end
    state.activeLine = 0;
    state.msg = `Operation ${op} finished.`;
    steps.push(JSON.parse(JSON.stringify(state)));

    return steps;
  }, []);

  const applyStep = useCallback((idx: number) => {
    if (!stepsRef.current[idx]) return;
    const st = stepsRef.current[idx];
    setCurrentState(st);
    setActiveStepIdx(idx);
    setLogEntries(prev => {
      if (idx === 0) return [{ type: "INFO", msg: st.msg }];
      const slice = prev.slice(0, idx);
      if (slice[slice.length - 1]?.msg !== st.msg) slice.push({ type: "STEP", msg: st.msg });
      return slice;
    });
  }, []);

  const autoStep = useCallback(() => {
    if (!runningRef.current || pausedRef.current) return;
    if (stepIdxRef.current >= stepsRef.current.length) {
      runningRef.current = false; setRunning(false);
      baseStateRef.current = JSON.parse(JSON.stringify(stepsRef.current[stepsRef.current.length - 1])); // update base
      return;
    }
    applyStep(stepIdxRef.current);
    stepIdxRef.current++;
    timerRef.current = setTimeout(autoStep, getDelay());
  }, [applyStep]);

  const runOperation = useCallback((op: string, args: any = {}) => {
    if (runningRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    
    setLogEntries([]);
    setActiveStepIdx(-1);
    
    stepsRef.current = buildSteps(op, args);
    stepIdxRef.current = 0;
    runningRef.current = true;
    pausedRef.current = false;
    setRunning(true);
    setPaused(false);
    
    setTimeout(() => autoStep(), 10);
  }, [buildSteps, autoStep]);

  const togglePause = useCallback(() => {
    if (!runningRef.current) return;
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    if (!pausedRef.current) autoStep();
  }, [autoStep]);

  const resetList = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    runningRef.current = false; pausedRef.current = false;
    setRunning(false); setPaused(false);
    
    const fresh: LLSnapshot = { nodes: [], head: null, tail: null, pointers: {}, msg: "List reset.", activeLine: 0, activeCodeKey: null };
    baseStateRef.current = fresh;
    setCurrentState(fresh);
    setLogEntries([]);
  }, []);

  const initList = useCallback((vals: number[]) => {
    resetList();
    const nodes: LLNodeData[] = vals.map(v => ({ id: `node-${Math.random().toString(36).substr(2, 9)}`, val: v, nextId: null }));
    for(let i=0; i<nodes.length - 1; i++) nodes[i].nextId = nodes[i+1].id;
    
    const st: LLSnapshot = {
      nodes, head: nodes[0]?.id || null, tail: nodes[nodes.length - 1]?.id || null, pointers: {}, msg: "Initialized array.", activeLine: 0, activeCodeKey: null
    };
    baseStateRef.current = st;
    setCurrentState(st);
  }, [resetList]);

  return {
    running, paused, currentState, activeStepIdx, logEntries,
    runOperation, togglePause, resetList, initList,
    setSpeed: useCallback((s: number) => { speedRef.current = s; }, []),
  };
}
