// Native MaxHeap implementation for internal sorting
export class MaxHeap {
  constructor(compareFn) {
    this.heap = [];
    this.compare = compareFn;
  }

  getParentIndex(i) {
    return Math.floor((i - 1) / 2);
  }

  getLeftChildIndex(i) {
    return 2 * i + 1;
  }

  getRightChildIndex(i) {
    return 2 * i + 2;
  }

  swap(i, j) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }

  insert(value) {
    this.heap.push(value);
    this.heapifyUp(this.heap.length - 1);
  }

  heapifyUp(index) {
    let currentIndex = index;
    while (currentIndex > 0) {
      const parentIndex = this.getParentIndex(currentIndex);
      if (this.compare(this.heap[currentIndex], this.heap[parentIndex]) > 0) {
        this.swap(currentIndex, parentIndex);
        currentIndex = parentIndex;
      } else {
        break;
      }
    }
  }

  extractMax() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();
    const max = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.heapifyDown(0);
    return max;
  }

  heapifyDown(index) {
    let currentIndex = index;
    const length = this.heap.length;
    while (this.getLeftChildIndex(currentIndex) < length) {
      let largerChildIndex = this.getLeftChildIndex(currentIndex);
      const rightChildIndex = this.getRightChildIndex(currentIndex);
      if (
        rightChildIndex < length &&
        this.compare(this.heap[rightChildIndex], this.heap[largerChildIndex]) > 0
      ) {
        largerChildIndex = rightChildIndex;
      }
      if (this.compare(this.heap[largerChildIndex], this.heap[currentIndex]) > 0) {
        this.swap(currentIndex, largerChildIndex);
        currentIndex = largerChildIndex;
      } else {
        break;
      }
    }
  }
}

// Consistent seed-based views hash function
export const getItemViews = (name, id) => {
  const str = `${name}-${id || 0}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 980) + 120; // 120 to 1100 views
};

export const getBrandViews = (b) => b.views || b.viewCount || getItemViews(b.name, b.id);
export const getBandViews = (b) => b.views || b.viewCount || getItemViews(b.name, b.id);
export const getProductViews = (p) => p.views || p.viewCount || getItemViews(p.name, p.id);
