class Line {
  constructor(start, end, dist, color) {
    this.start = start;
    this.end = end;
    this.dist = dist;
    this.color = color;
  }

  draw() {
    push();
    stroke(this.color);
    drawingContext.setLineDash([5, 15]);
    line(this.start.x, this.start.y, this.end.x, this.end.y);
    noStroke();
    translate((this.start.x + this.end.x) / 2, (this.start.y + this.end.y) / 2);

    rotate(this.getAngle(this.start, this.end));
    textSize(15);

    text(`${this.dist.toFixed(2)} km\n`, 0, 0);
    pop();
  }

  getAngle(p1, p2) {
    if (p1.x > p2.x) return Math.atan2(p1.y - p2.y, p1.x - p2.x);
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  }
}