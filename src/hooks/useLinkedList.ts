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
      case "forwardTraversal": {
        push(1, `forwardTraversal() called.`);
        const visited: number[] = [];
        state.extraState = { output: [...visited] };

        let tempId: string | null = state.head;
        if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
        push(2, `Node* temp = head;`);

        while (tempId !== null) {
          push(3, `while(temp != NULL) -> true`);
          const tNode = state.nodes.find(n => n.id === tempId);
          visited.push(tNode!.val);
          state.extraState = { output: [...visited] };
          push(4, `cout << temp->data << " "; // output: ${visited.join(" ")}`);

          tempId = tNode?.nextId || null;
          if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
          push(5, `temp = temp->next;`);
        }
        push(3, `while(temp != NULL) -> false. Loop ends.`);
        push(7, `cout << endl; // Traversal complete.`);
        break;
      }
      case "recursiveTraversal": {
        push(6, `recursiveTraversal() called.`);
        push(7, `recursiveTraversalUtil(head);`);
        const visited: number[] = [];
        state.extraState = { output: [...visited], callDepth: 0 };
        let nodeId: string | null = state.head;
        let depth = 0;

        // Descend through the list recursively
        while (nodeId !== null) {
          const nd = state.nodes.find(n => n.id === nodeId);
          if (nodeId) state.pointers[`frame${depth}`] = nodeId;
          state.extraState = { output: [...visited], callDepth: depth };
          push(1, `${"  ".repeat(depth)}recursiveTraversalUtil(node=${nd?.val})`);
          push(2, `${"  ".repeat(depth)}if(node == NULL) -> false`);
          visited.push(nd!.val);
          state.extraState = { output: [...visited], callDepth: depth };
          push(3, `${"  ".repeat(depth)}cout << node->data; // output: ${visited.join(" ")}`);
          push(4, `${"  ".repeat(depth)}recursiveTraversalUtil(node->next);`);

          nodeId = nd?.nextId || null;
          depth++;
        }

        // Base case: NULL
        state.extraState = { output: [...visited], callDepth: depth };
        push(1, `${"  ".repeat(depth)}recursiveTraversalUtil(node=NULL)`);
        push(2, `${"  ".repeat(depth)}if(node == NULL) -> true. return;`);

        // Unwind the call stack
        for (let i = depth - 1; i >= 0; i--) {
          delete state.pointers[`frame${i}`];
          state.extraState = { output: [...visited], callDepth: i };
          push(5, `${"  ".repeat(i)}Returning from depth ${i}.`);
        }

        push(8, `cout << endl; // Traversal complete.`);
        break;
      }
      case "zigzagTraversal": {
        push(1, `zigzagTraversal() called.`);
        const arr: number[] = [];
        state.extraState = { arr: [...arr], output: [], direction: "→" };

        // Phase 1: Collect all values into array
        let tempId: string | null = state.head;
        if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
        push(3, `Node* temp = head;`);

        while (tempId !== null) {
          push(4, `while(temp != NULL) -> true`);
          const tNode = state.nodes.find(n => n.id === tempId);
          arr.push(tNode!.val);
          state.extraState = { arr: [...arr], output: [], direction: "→" };
          push(5, `arr.push_back(temp->data); // arr = [${arr.join(", ")}]`);

          tempId = tNode?.nextId || null;
          if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
          push(6, `temp = temp->next;`);
        }
        push(4, `while loop ends. Array collected.`);
        delete state.pointers["temp"];

        // Phase 2: Zigzag through the array
        let leftToRight = true;
        let i = 0;
        let j = arr.length - 1;
        const output: number[] = [];
        state.extraState = { arr: [...arr], output: [...output], i, j, direction: "→" };
        push(8, `bool leftToRight = true;`);
        push(9, `int i = 0, j = ${j};`);

        while (i <= j) {
          const dir = leftToRight ? "→" : "←";
          state.extraState = { arr: [...arr], output: [...output], i, j, direction: dir };
          push(10, `while(i <= j) -> ${i} <= ${j} -> true`);

          if (leftToRight) {
            output.push(arr[i]);
            state.extraState = { arr: [...arr], output: [...output], i, j, direction: dir };
            push(11, `leftToRight: cout << arr[${i}] (${arr[i]}); i++; // output: ${output.join(" ")}`);
            i++;
          } else {
            output.push(arr[j]);
            state.extraState = { arr: [...arr], output: [...output], i, j, direction: dir };
            push(12, `rightToLeft: cout << arr[${j}] (${arr[j]}); j--; // output: ${output.join(" ")}`);
            j--;
          }
          leftToRight = !leftToRight;
          state.extraState = { arr: [...arr], output: [...output], i, j, direction: leftToRight ? "→" : "←" };
          push(13, `leftToRight = !leftToRight; -> ${leftToRight ? "true (→)" : "false (←)"}`);
        }
        push(10, `while(i <= j) -> false. Loop ends.`);
        push(15, `cout << endl; // Zigzag traversal complete: ${output.join(" ")}`);
        break;
      }
      case "recursiveReverse": {
        push(9, `recursiveReverse() called.`);
        state.tail = state.head;
        push(10, `tail = head;`);
        push(11, `head = recursiveReverseUtil(head);`);

        if (!state.head) { push(1, `List is empty.`); break; }

        // Build ordered list of node IDs from head
        const nodeIds: string[] = [];
        let nid: string | null = state.head;
        while (nid) {
          nodeIds.push(nid);
          const nd = state.nodes.find(n => n.id === nid);
          nid = nd?.nextId || null;
        }

        // Recursive descent
        for (let d = 0; d < nodeIds.length; d++) {
          const nd = state.nodes.find(n => n.id === nodeIds[d]);
          state.pointers[`frame${d}`] = nodeIds[d];
          push(1, `${"  ".repeat(d)}recursiveReverseUtil(node=${nd?.val})`);
          if (d === nodeIds.length - 1) {
            push(2, `${"  ".repeat(d)}node->next == NULL -> return node; (base case)`);
          } else {
            push(2, `${"  ".repeat(d)}node != NULL && node->next != NULL`);
            push(4, `${"  ".repeat(d)}Node* rest = recursiveReverseUtil(node->next);`);
          }
        }

        // Unwind: reverse pointers
        for (let d = nodeIds.length - 1; d > 0; d--) {
          const currNode = state.nodes.find(n => n.id === nodeIds[d]);
          const prevNode = state.nodes.find(n => n.id === nodeIds[d - 1]);
          // node->next->next = node  (currNode.next = prevNodeId... wait)
          // At depth d-1: node = nodeIds[d-1], node->next = nodeIds[d]
          // node->next->next = node means nodeIds[d].next = nodeIds[d-1]
          if (currNode) currNode.nextId = nodeIds[d - 1];
          push(5, `${"  ".repeat(d - 1)}node->next->next = node; (${currNode?.val}->next = ${prevNode?.val})`);
          if (prevNode) prevNode.nextId = null;
          push(6, `${"  ".repeat(d - 1)}node->next = NULL;`);
          push(7, `${"  ".repeat(d - 1)}return rest;`);
          delete state.pointers[`frame${d}`];
        }
        delete state.pointers[`frame0`];

        state.head = nodeIds[nodeIds.length - 1];
        push(11, `head = ${state.nodes.find(n => n.id === state.head)?.val}; Reverse complete.`);
        break;
      }
      case "reverseInGroups": {
        const k = args.val as number;
        push(1, `reverseKGroup(head, ${k}) called.`);
        if (k <= 0 || !state.head) { push(1, `Invalid k or empty list.`); break; }

        // Build ordered list
        const orderedIds: string[] = [];
        let nid2: string | null = state.head;
        while (nid2) {
          orderedIds.push(nid2);
          const nd = state.nodes.find(n => n.id === nid2);
          nid2 = nd?.nextId || null;
        }

        // Process groups
        let groupStart = 0;
        let prevGroupTail: string | null = null;
        let groupNum = 0;

        while (groupStart < orderedIds.length) {
          const groupEnd = Math.min(groupStart + k, orderedIds.length);
          const groupIds = orderedIds.slice(groupStart, groupEnd);
          groupNum++;

          push(1, `--- Group ${groupNum}: [${groupIds.map(id => state.nodes.find(n => n.id === id)?.val).join(", ")}] ---`);

          // Reverse this group
          let prevId: string | null = null;
          let currId: string | null = groupIds[0];

          for (let gi = 0; gi < groupIds.length; gi++) {
            const cNode = state.nodes.find(n => n.id === groupIds[gi]);
            if (groupIds[gi]) state.pointers["curr"] = groupIds[gi];

            const nextId = gi + 1 < groupIds.length ? groupIds[gi + 1] : (groupEnd < orderedIds.length ? orderedIds[groupEnd] : null);
            push(7, `next = curr->next;`);

            if (cNode) cNode.nextId = prevId;
            push(8, `curr->next = prev; (${cNode?.val}->next = ${prevId ? state.nodes.find(n => n.id === prevId)?.val : "NULL"})`);

            prevId = groupIds[gi];
            if (prevId) state.pointers["prev"] = prevId;
            push(9, `prev = curr;`);
            push(10, `count++;`);
          }

          // After reversing, groupIds[0] is now the tail of this group
          // groupIds[groupIds.length-1] is the new head of this group
          const newGroupHead = groupIds[groupIds.length - 1];
          const newGroupTail = groupIds[0];

          // Connect previous group's tail to this group's new head
          if (prevGroupTail) {
            const ptNode = state.nodes.find(n => n.id === prevGroupTail);
            if (ptNode) ptNode.nextId = newGroupHead;
            push(14, `Previous group tail->next = ${state.nodes.find(n => n.id === newGroupHead)?.val}`);
          } else {
            state.head = newGroupHead;
            push(1, `head = ${state.nodes.find(n => n.id === newGroupHead)?.val};`);
          }

          // Connect this group's tail to the next group (temporarily)
          const tailNode = state.nodes.find(n => n.id === newGroupTail);
          if (tailNode) tailNode.nextId = groupEnd < orderedIds.length ? orderedIds[groupEnd] : null;

          prevGroupTail = newGroupTail;
          groupStart = groupEnd;
        }

        // Update tail
        if (prevGroupTail) state.tail = prevGroupTail;
        push(15, `Reverse in groups of ${k} complete.`);
        delete state.pointers["curr"];
        delete state.pointers["prev"];
        break;
      }
      case "reverseAlternateK": {
        const k = args.val as number;
        push(1, `reverseAltK(head, ${k}) called.`);
        if (k <= 0 || !state.head) { push(1, `Invalid k or empty list.`); break; }

        // Build ordered list
        const orderedIds: string[] = [];
        let nid3: string | null = state.head;
        while (nid3) {
          orderedIds.push(nid3);
          const nd = state.nodes.find(n => n.id === nid3);
          nid3 = nd?.nextId || null;
        }

        let idx = 0;
        let prevGroupTail: string | null = null;
        let reverse = true;
        let roundNum = 0;

        while (idx < orderedIds.length) {
          const end = Math.min(idx + k, orderedIds.length);
          const groupIds = orderedIds.slice(idx, end);
          roundNum++;

          if (reverse) {
            push(6, `--- Reverse group ${roundNum}: [${groupIds.map(id => state.nodes.find(n => n.id === id)?.val).join(", ")}] ---`);

            // Reverse this group
            let prevId: string | null = null;
            for (let gi = 0; gi < groupIds.length; gi++) {
              const cNode = state.nodes.find(n => n.id === groupIds[gi]);
              if (groupIds[gi]) state.pointers["curr"] = groupIds[gi];
              if (cNode) cNode.nextId = prevId;
              push(8, `curr->next = prev; (${cNode?.val}->next = ${prevId ? state.nodes.find(n => n.id === prevId)?.val : "NULL"})`);
              prevId = groupIds[gi];
              push(10, `count++;`);
            }

            const newGroupHead = groupIds[groupIds.length - 1];
            const newGroupTail = groupIds[0];

            if (prevGroupTail) {
              const ptNode = state.nodes.find(n => n.id === prevGroupTail);
              if (ptNode) ptNode.nextId = newGroupHead;
            } else {
              state.head = newGroupHead;
              push(1, `head = ${state.nodes.find(n => n.id === newGroupHead)?.val};`);
            }

            const tailNode = state.nodes.find(n => n.id === newGroupTail);
            if (tailNode) tailNode.nextId = end < orderedIds.length ? orderedIds[end] : null;
            prevGroupTail = newGroupTail;
          } else {
            push(15, `--- Skip group ${roundNum}: [${groupIds.map(id => state.nodes.find(n => n.id === id)?.val).join(", ")}] ---`);

            // Just keep them as-is, connect previous tail
            if (prevGroupTail) {
              const ptNode = state.nodes.find(n => n.id === prevGroupTail);
              if (ptNode) ptNode.nextId = groupIds[0];
            }

            // Ensure chain within group
            for (let gi = 0; gi < groupIds.length - 1; gi++) {
              const nd = state.nodes.find(n => n.id === groupIds[gi]);
              if (nd) nd.nextId = groupIds[gi + 1];
            }
            const lastInGroup = state.nodes.find(n => n.id === groupIds[groupIds.length - 1]);
            if (lastInGroup) lastInGroup.nextId = end < orderedIds.length ? orderedIds[end] : null;

            for (const gid of groupIds) {
              state.pointers["curr"] = gid;
              push(17, `Skipping node ${state.nodes.find(n => n.id === gid)?.val}`);
            }

            prevGroupTail = groupIds[groupIds.length - 1];
          }

          reverse = !reverse;
          idx = end;
        }

        // Update tail
        let t: string | null = state.head;
        let lastId2: string | null = t;
        while (t) { lastId2 = t; const nd = state.nodes.find(n => n.id === t); t = nd?.nextId || null; }
        state.tail = lastId2;
        delete state.pointers["curr"];
        push(21, `Reverse alternate ${k} nodes complete.`);
        break;
      }
      case "reverseSublist": {
        const left = args.pos as number;
        const right = args.val as number;
        push(1, `reverseSublist(${left}, ${right}) called.`);

        if (!state.head || left <= 0 || right <= 0 || left >= right) {
          push(2, `Invalid range or empty list. Return.`);
          break;
        }

        // Build ordered list
        const orderedIds: string[] = [];
        let nid4: string | null = state.head;
        while (nid4) {
          orderedIds.push(nid4);
          const nd = state.nodes.find(n => n.id === nid4);
          nid4 = nd?.nextId || null;
        }

        if (left > orderedIds.length || right > orderedIds.length) {
          push(2, `Range out of bounds. Return.`);
          break;
        }

        // Navigate to node before left
        push(3, `Node dummy(0); dummy.next = head;`);
        push(4, `Node* pre = &dummy;`);
        const preIdx = left - 2; // -1 for 0-indexing, -1 for "before"
        if (preIdx >= 0) {
          state.pointers["pre"] = orderedIds[preIdx];
          push(5, `Moving pre to position ${left - 1} (node ${state.nodes.find(n => n.id === orderedIds[preIdx])?.val})`);
        } else {
          push(5, `pre stays at dummy (before head).`);
        }

        // Reverse from left to right using the "pull forward" method
        const sublistIds = orderedIds.slice(left - 1, right);
        let currIdx = left - 1; // 0-indexed position of curr
        state.pointers["curr"] = orderedIds[currIdx];
        push(6, `Node* curr = pre->next; (${state.nodes.find(n => n.id === orderedIds[currIdx])?.val})`);

        for (let step = 0; step < right - left; step++) {
          const currNode = state.nodes.find(n => n.id === orderedIds[currIdx]);
          const nxtIdx = currIdx + step + 1; // next node to pull
          if (nxtIdx >= orderedIds.length) break;

          const nxtNode = state.nodes.find(n => n.id === orderedIds[nxtIdx]);
          state.pointers["nxt"] = orderedIds[nxtIdx];
          push(8, `Node* nxt = curr->next; (${nxtNode?.val})`);

          // curr->next = nxt->next
          if (currNode) currNode.nextId = nxtNode?.nextId || null;
          push(9, `curr->next = nxt->next;`);

          // nxt->next = pre->next (the current head of the reversed portion)
          // figure out who pre->next is
          const preNextId = preIdx >= 0
            ? state.nodes.find(n => n.id === orderedIds[preIdx])?.nextId
            : state.head;

          // Actually we need to track the real pre->next
          // After previous iterations, pre->next may have changed
          // Let's compute pre->next from the current state
          let actualPreNext: string | null;
          if (preIdx >= 0) {
            actualPreNext = state.nodes.find(n => n.id === orderedIds[preIdx])!.nextId;
          } else {
            actualPreNext = state.head;
          }

          if (nxtNode) nxtNode.nextId = actualPreNext;
          push(10, `nxt->next = pre->next; (${nxtNode?.val}->next = ${actualPreNext ? state.nodes.find(n => n.id === actualPreNext)?.val : "NULL"})`);

          // pre->next = nxt
          if (preIdx >= 0) {
            const preNode = state.nodes.find(n => n.id === orderedIds[preIdx]);
            if (preNode) preNode.nextId = orderedIds[nxtIdx];
          } else {
            state.head = orderedIds[nxtIdx];
          }
          push(11, `pre->next = nxt; (${nxtNode?.val})`);
        }

        delete state.pointers["nxt"];
        delete state.pointers["curr"];
        delete state.pointers["pre"];

        // Update tail
        let t2: string | null = state.head;
        let lastId3: string | null = t2;
        while (t2) { lastId3 = t2; const nd = state.nodes.find(n => n.id === t2); t2 = nd?.nextId || null; }
        state.tail = lastId3;
        push(13, `head = dummy.next; Reverse sublist [${left}..${right}] complete.`);
        break;
      }
      case "pairwiseReverse": {
        push(1, `pairwiseReverse() called.`);
        let currId: string | null = state.head;
        if (currId) state.pointers["curr"] = currId;
        push(2, `Node* curr = head;`);

        let pairNum = 0;
        while (currId !== null) {
          const cNode = state.nodes.find(n => n.id === currId);
          push(3, `while(curr && curr->next) check.`);
          if (!cNode?.nextId) {
            push(3, `curr->next is NULL. Loop ends.`);
            break;
          }

          const nextNode = state.nodes.find(n => n.id === cNode.nextId);
          pairNum++;
          push(4, `Pair ${pairNum}: swap(${cNode.val}, ${nextNode?.val})`);

          // Swap values
          const tempVal = cNode.val;
          cNode.val = nextNode!.val;
          nextNode!.val = tempVal;
          push(4, `After swap: (${cNode.val}, ${nextNode?.val})`);

          // Move to next pair
          currId = nextNode?.nextId || null;
          if (currId) state.pointers["curr"] = currId; else delete state.pointers["curr"];
          push(5, `curr = curr->next->next;`);
        }
        push(6, `Pairwise reverse complete.`);
        break;
      }
      case "reverseUsingStack": {
        push(1, `reverseUsingStack() called.`);
        const stack: number[] = [];
        state.extraState = { stack: [...stack] };

        // Phase 1: Push all values to stack
        let tempId: string | null = state.head;
        if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
        push(3, `Node* temp = head;`);

        while (tempId !== null) {
          push(4, `while(temp != NULL) -> true`);
          const tNode = state.nodes.find(n => n.id === tempId);
          stack.push(tNode!.val);
          state.extraState = { stack: [...stack] };
          push(5, `st.push(${tNode!.val}); // stack: [${stack.join(", ")}]`);

          tempId = tNode?.nextId || null;
          if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
          push(6, `temp = temp->next;`);
        }
        push(4, `while loop ends. All values pushed.`);

        // Phase 2: Pop from stack and overwrite node values
        tempId = state.head;
        if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
        push(8, `temp = head;`);

        while (tempId !== null) {
          push(9, `while(temp != NULL) -> true`);
          const tNode = state.nodes.find(n => n.id === tempId);
          const topVal = stack.pop()!;
          state.extraState = { stack: [...stack] };
          const oldVal = tNode!.val;
          tNode!.val = topVal;
          push(10, `temp->data = st.top() (${topVal}); // was ${oldVal}`);
          push(11, `st.pop(); // stack: [${stack.join(", ")}]`);

          tempId = tNode?.nextId || null;
          if (tempId) state.pointers["temp"] = tempId; else delete state.pointers["temp"];
          push(12, `temp = temp->next;`);
        }
        push(9, `while loop ends. Reverse using stack complete.`);
        break;
      }
      case "bubbleSortLL": {
        push(1, `bubbleSortLL() called.`);
        if (!state.head) { push(2, `List is empty. Return.`); break; }
        const getIds = () => { const ids: string[] = []; let c: string | null = state.head; while (c) { ids.push(c); const nd = state.nodes.find(n => n.id === c); c = nd?.nextId || null; } return ids; };
        let swapped = true;
        let passNum = 0;
        const sortedFromEnd = new Set<string>();
        while (swapped) {
          swapped = false;
          passNum++;
          const ids = getIds();
          state.extraState = { _sort: "bubble", pass: passNum, comparing: [], swapping: [], sorted: Array.from(sortedFromEnd) };
          push(4, `--- Pass ${passNum} ---`);
          for (let ci = 0; ci < ids.length - 1; ci++) {
            if (sortedFromEnd.has(ids[ci + 1])) continue;
            const currNode = state.nodes.find(n => n.id === ids[ci])!;
            const nextNode = state.nodes.find(n => n.id === ids[ci + 1])!;
            state.pointers["curr"] = ids[ci];
            state.extraState = { _sort: "bubble", pass: passNum, comparing: [ids[ci], ids[ci + 1]], swapping: [], sorted: Array.from(sortedFromEnd) };
            push(7, `Comparing ${currNode.val} and ${nextNode.val}`);
            if (currNode.val > nextNode.val) {
              state.extraState = { _sort: "bubble", pass: passNum, comparing: [], swapping: [ids[ci], ids[ci + 1]], sorted: Array.from(sortedFromEnd) };
              push(9, `swap(${currNode.val}, ${nextNode.val})`);
              const tmp = currNode.val; currNode.val = nextNode.val; nextNode.val = tmp;
              swapped = true;
            }
          }
          // Last unsorted node is now sorted
          const idsAfter = getIds();
          const lastUnsorted = idsAfter.filter(id => !sortedFromEnd.has(id));
          if (lastUnsorted.length > 0) sortedFromEnd.add(lastUnsorted[lastUnsorted.length - 1]);
          state.extraState = { _sort: "bubble", pass: passNum, comparing: [], swapping: [], sorted: Array.from(sortedFromEnd) };
          push(14, `Pass ${passNum} done. swapped=${swapped}`);
        }
        const allIds = getIds();
        state.extraState = { _sort: "bubble", pass: passNum, comparing: [], swapping: [], sorted: allIds };
        push(15, `Bubble sort complete.`);
        delete state.pointers["curr"];
        break;
      }
      case "selectionSortLL": {
        push(1, `selectionSortLL() called.`);
        if (!state.head) { push(2, `List is empty. Return.`); break; }
        const getIds = () => { const ids: string[] = []; let c: string | null = state.head; while (c) { ids.push(c); const nd = state.nodes.find(n => n.id === c); c = nd?.nextId || null; } return ids; };
        const ids = getIds();
        const sortedIds: string[] = [];
        for (let ii = 0; ii < ids.length; ii++) {
          const iNode = state.nodes.find(n => n.id === ids[ii])!;
          state.pointers["i"] = ids[ii];
          let minIdx = ii;
          state.pointers["min"] = ids[minIdx];
          state.extraState = { _sort: "selection", sorted: [...sortedIds], target: ids[ii], minId: ids[minIdx], scanning: null, swapping: [] };
          push(3, `i = node(${iNode.val}) at position ${ii + 1}`);
          for (let jj = ii + 1; jj < ids.length; jj++) {
            const jNode = state.nodes.find(n => n.id === ids[jj])!;
            const minNode = state.nodes.find(n => n.id === ids[minIdx])!;
            state.pointers["j"] = ids[jj];
            state.extraState = { _sort: "selection", sorted: [...sortedIds], target: ids[ii], minId: ids[minIdx], scanning: ids[jj], swapping: [] };
            push(6, `j=${jNode.val}: ${jNode.val} < ${minNode.val}?`);
            if (jNode.val < minNode.val) {
              minIdx = jj;
              state.pointers["min"] = ids[minIdx];
              push(7, `New min: ${jNode.val}`);
            }
          }
          delete state.pointers["j"];
          if (minIdx !== ii) {
            const minNode = state.nodes.find(n => n.id === ids[minIdx])!;
            const currentINode = state.nodes.find(n => n.id === ids[ii])!;
            state.extraState = { _sort: "selection", sorted: [...sortedIds], target: ids[ii], minId: ids[minIdx], scanning: null, swapping: [ids[ii], ids[minIdx]] };
            push(11, `swap(${currentINode.val}, ${minNode.val})`);
            const tmp = currentINode.val; currentINode.val = minNode.val; minNode.val = tmp;
          }
          sortedIds.push(ids[ii]);
          state.extraState = { _sort: "selection", sorted: [...sortedIds], target: null, minId: null, scanning: null, swapping: [] };
          push(12, `Position ${ii + 1} is now sorted.`);
        }
        state.extraState = { _sort: "selection", sorted: [...ids], target: null, minId: null, scanning: null, swapping: [] };
        delete state.pointers["i"]; delete state.pointers["min"];
        push(14, `Selection sort complete.`);
        break;
      }
      case "insertionSortLL": {
        push(1, `insertionSortLL() called.`);
        if (!state.head) { push(2, `List is empty. Return.`); break; }
        const getIds = () => { const ids: string[] = []; let c: string | null = state.head; while (c) { ids.push(c); const nd = state.nodes.find(n => n.id === c); c = nd?.nextId || null; } return ids; };
        const ids = getIds();
        const sortedVals: number[] = [state.nodes.find(n => n.id === ids[0])!.val];
        const sortedNodeIds = [ids[0]];
        state.extraState = { _sort: "insertion", sorted: [...sortedNodeIds], keyId: null };
        push(3, `sorted = [${sortedVals.join(", ")}]`);
        for (let ci = 1; ci < ids.length; ci++) {
          const currNode = state.nodes.find(n => n.id === ids[ci])!;
          state.pointers["curr"] = ids[ci];
          const currVal = currNode.val;
          state.extraState = { _sort: "insertion", sorted: [...sortedNodeIds], keyId: ids[ci] };
          push(5, `Key = ${currVal}, picking from unsorted.`);
          let insertIdx = sortedVals.length;
          for (let si = 0; si < sortedVals.length; si++) {
            if (sortedVals[si] >= currVal) { insertIdx = si; break; }
          }
          push(7, `Insert position for ${currVal}: index ${insertIdx + 1}`);
          sortedVals.splice(insertIdx, 0, currVal);
          for (let si = 0; si <= ci; si++) {
            state.nodes.find(n => n.id === ids[si])!.val = sortedVals[si];
          }
          sortedNodeIds.push(ids[ci]);
          state.extraState = { _sort: "insertion", sorted: [...sortedNodeIds], keyId: null };
          push(8, `Inserted. sorted = [${sortedVals.join(", ")}]`);
        }
        state.extraState = { _sort: "insertion", sorted: [...ids], keyId: null };
        delete state.pointers["curr"];
        push(19, `Insertion sort complete.`);
        break;
      }
      case "mergeSortLL": {
        push(19, `mergeSort(head) called.`);
        if (!state.head) { push(20, `List is empty. Return.`); break; }
        const getIds = () => { const ids: string[] = []; let c: string | null = state.head; while (c) { ids.push(c); const nd = state.nodes.find(n => n.id === c); c = nd?.nextId || null; } return ids; };
        const ids = getIds();
        const vals = ids.map(id => state.nodes.find(n => n.id === id)!.val);
        const mergeSort = (arr: number[], depth: number, label: string): number[] => {
          state.extraState = { _sort: "merge", depth, left: [], right: [], comparing: [], phase: "split" };
          push(19, `${"  ".repeat(depth)}mergeSort([${arr.join(", ")}]) ${label}`);
          if (arr.length <= 1) { push(20, `${"  ".repeat(depth)}Base case.`); return arr; }
          const mid = Math.floor(arr.length / 2);
          state.extraState = { _sort: "merge", depth, left: arr.slice(0, mid), right: arr.slice(mid), comparing: [], phase: "split" };
          push(21, `${"  ".repeat(depth)}Split at mid=${mid}`);
          const left = mergeSort(arr.slice(0, mid), depth + 1, "(left)");
          const right = mergeSort(arr.slice(mid), depth + 1, "(right)");
          state.extraState = { _sort: "merge", depth, left, right, comparing: [], phase: "merge" };
          push(9, `${"  ".repeat(depth)}merge([${left.join(", ")}], [${right.join(", ")}])`);
          const merged: number[] = [];
          let li = 0, ri = 0;
          while (li < left.length && ri < right.length) {
            state.extraState = { _sort: "merge", depth, left, right, comparing: [left[li], right[ri]], phase: "merge" };
            push(10, `${"  ".repeat(depth)}Compare ${left[li]} vs ${right[ri]}`);
            if (left[li] <= right[ri]) merged.push(left[li++]); else merged.push(right[ri++]);
          }
          while (li < left.length) merged.push(left[li++]);
          while (ri < right.length) merged.push(right[ri++]);
          state.extraState = { _sort: "merge", depth, left: [], right: [], comparing: [], merged, phase: "done" };
          push(9, `${"  ".repeat(depth)}merged = [${merged.join(", ")}]`);
          return merged;
        };
        const sorted = mergeSort(vals, 0, "(full list)");
        for (let si = 0; si < ids.length; si++) state.nodes.find(n => n.id === ids[si])!.val = sorted[si];
        state.extraState = { _sort: "merge", depth: 0, left: [], right: [], comparing: [], merged: sorted, phase: "complete" };
        push(24, `Merge sort complete.`);
        break;
      }
      case "quickSortLL": {
        push(1, `quickSort() called on linked list.`);
        if (!state.head) { push(2, `List is empty. Return.`); break; }
        const getIds = () => { const ids: string[] = []; let c: string | null = state.head; while (c) { ids.push(c); const nd = state.nodes.find(n => n.id === c); c = nd?.nextId || null; } return ids; };
        const ids = getIds();
        const pivotedIds = new Set<string>();
        const quickSort = (startIdx: number, endIdx: number, depth: number) => {
          if (startIdx >= endIdx) { if (startIdx === endIdx) pivotedIds.add(ids[startIdx]); return; }
          const pivotNode = state.nodes.find(n => n.id === ids[endIdx])!;
          const pivotVal = pivotNode.val;
          state.pointers["pivot"] = ids[endIdx];
          state.extraState = { _sort: "quick", pivotId: ids[endIdx], comparing: null, sorted: Array.from(pivotedIds) };
          push(3, `${"  ".repeat(depth)}Pivot = ${pivotVal}`);
          let storeIdx = startIdx;
          for (let ci = startIdx; ci < endIdx; ci++) {
            const cNode = state.nodes.find(n => n.id === ids[ci])!;
            state.pointers["curr"] = ids[ci];
            state.extraState = { _sort: "quick", pivotId: ids[endIdx], comparing: ids[ci], sorted: Array.from(pivotedIds) };
            push(5, `${"  ".repeat(depth)}${cNode.val} < ${pivotVal}?`);
            if (cNode.val < pivotVal) {
              if (storeIdx !== ci) {
                const storeNode = state.nodes.find(n => n.id === ids[storeIdx])!;
                const tmp = storeNode.val; storeNode.val = cNode.val; cNode.val = tmp;
                push(6, `${"  ".repeat(depth)}swap pos ${storeIdx + 1} and ${ci + 1}`);
              }
              storeIdx++;
            }
          }
          if (storeIdx !== endIdx) {
            const storeNode = state.nodes.find(n => n.id === ids[storeIdx])!;
            const tmp = storeNode.val; storeNode.val = pivotVal; pivotNode.val = tmp;
          }
          pivotedIds.add(ids[storeIdx]);
          delete state.pointers["curr"];
          state.extraState = { _sort: "quick", pivotId: ids[storeIdx], comparing: null, sorted: Array.from(pivotedIds) };
          push(18, `${"  ".repeat(depth)}Pivot placed at pos ${storeIdx + 1}`);
          quickSort(startIdx, storeIdx - 1, depth + 1);
          quickSort(storeIdx + 1, endIdx, depth + 1);
        };
        quickSort(0, ids.length - 1, 0);
        delete state.pointers["pivot"];
        state.extraState = { _sort: "quick", pivotId: null, comparing: null, sorted: [...ids] };
        push(20, `Quick sort complete.`);
        break;
      }
      // You can add detectCycle etc. easily by expanding this later!
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
