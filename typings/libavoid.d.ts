declare module "libavoid-js";

declare interface Point {
  new (x: number, y: number): Point;
  x: number;
  y: number;
}

declare interface Router {
  new (flags: number): Router;

  processTransaction(): void;
  printInfo(): void;
  deleteConnector(connRef: ConnRef): void;

  moveShape(shape: ShapeRef, newPolygon: Polygon);
  moveShape(shape: ShapeRef, xDiff: number, yDiff: number);
  deleteShape(shape: ShapeRef);
  setRoutingParameter(parameter: number, value: number): void;
  setRoutingOption(option: number, value: boolean): void;
  hyperedgeRerouter(): HyperedgeRerouter;
}

declare interface PolyLine {
  size(): number;
  get_ps(index: number): Point;
}

declare interface ConnEnd {
  new (point: Point): ConnEnd;
  new (point: Point, visDirs: ConnDirFlags): ConnEnd;
  createConnEndFromJunctionRef(
    junctionRef: JunctionRef
  ): ConnEnd;
}

declare interface ConnRef {
  new (router: Router): ConnRef;
  new (router: Router, srcConnEnd: ConnEnd, dstConnEnd: ConnEnd): ConnRef;

  displayRoute(): PolyLine;
  setSourceEndpoint(srcPoint: ConnEnd): void;
  setDestEndpoint(dstPoint: ConnEnd): void;
  setRoutingType(type: number): void;
  // connRefPtr is raw pointer to the object, to get ConnRef object use:
  // `const connRef = Avoid.wrapPointer(connRefPtr, Avoid.ConnRef)`
  // more details: https://emscripten.org/docs/porting/connecting_cpp_and_javascript/WebIDL-Binder.html#pointers-and-comparisons
  setCallback(callback: (connRefPtr: number) => void, connRef: ConnRef): void;

  setHateCrossings(value: boolean): void;
  doesHateCrossings(): boolean;
}

declare enum ConnDirFlags {
  ConnDirNone = 0,
  ConnDirUp = 1,
  ConnDirDown = 2,
  ConnDirLeft = 4,
  ConnDirRight = 8,
  ConnDirAll = 15,
}

declare enum RoutingParameter {
  segmentPenalty,
  anglePenalty,
  crossingPenalty,
  clusterCrossingPenalty,
  fixedSharedPathPenalty,
  portDirectionPenalty,
  shapeBufferDistance,
  idealNudgingDistance,
  reverseDirectionPenalty,
}

declare enum RoutingOption {
  nudgeOrthogonalSegmentsConnectedToShapes,
  improveHyperedgeRoutesMovingJunctions,
  penaliseOrthogonalSharedPathsAtConnEnds,
  nudgeOrthogonalTouchingColinearSegments,
  performUnifyingNudgingPreprocessingStep,
  improveHyperedgeRoutesMovingAddingAndDeletingJunctions,
  nudgeSharedPathsWithCommonEndPoint,
}

declare interface ShapeConnectionPin {
  new (
    shape: ShapeRef,
    classId: number,
    xOffset: number,
    yOffset: number,
    proportional: boolean,
    insideOffset: number,
    visDirs: ConnDirFlags
  ): ShapeConnectionPin;
  new (
    junction: JunctionRef,
    classId: number,
    visDirs?: ConnDirFlags
  ): ShapeConnectionPin;

  setConnectionCost(cost: number): void;
  setExclusive(exclusive: boolean): void;
  isExclusive(): boolean;
  directions(): ConnDirFlags;
  position(): Point;
  updatePosition(newPosition: Point): void;
}

declare interface JunctionRef {
  new (router: Router, point: Point, id?: number): JunctionRef;

  position(): Point;
  setPositionFixed(fixed: boolean): void;
  positionFixed(): boolean;
  recommendedPosition(): Point;
}

declare interface HyperedgeRerouter {
  registerHyperedgeForRerouting(junction: JunctionRef): number;
}

declare interface ConnEndListBuilder {
  new (): ConnEndListBuilder;
  
  addConnEnd(connEnd: ConnEnd): void;
  addShapePin(shape: ShapeRef, pinClassId: number): void;
  addPoint(point: Point, visDirs?: ConnDirFlags): void;
  addJunction(junction: JunctionRef): void;
  clear(): void;
  size(): number;
  registerHyperedge(rerouter: HyperedgeRerouter): number;
}

declare interface HyperedgeNewAndDeletedObjectLists {}

declare interface Polygon {
  new (n: number): Polygon;
  size(): number;
  get_ps(index: number): Point;
  set_ps(index: number, point: Point): void;
}

declare interface Rectangle extends Polygon {
  new (centre: Point, width: number, height: number): Rectangle;
  new (topLeft: Point, bottomRight: Point): Rectangle;
}

declare interface Obstacle {
  id(): number;
  polygon(): Polygon;
  router(): Router;
  position(): Point;

  setNewPoly(polygon: Polygon): void;
}

declare interface ShapeRef extends Obstacle {
  new (router: Router, shapePoly: Polygon): ShapeRef;
}

export interface Avoid {
  [x: string]: any;
  PolyLineRouting: number;
  OrthogonalRouting: number;
  
  // Enums
  ConnDirNone: number;
  ConnDirUp: number;
  ConnDirDown: number;
  ConnDirLeft: number;
  ConnDirRight: number;
  ConnDirAll: number;
  
  segmentPenalty: number;
  anglePenalty: number;
  crossingPenalty: number;
  clusterCrossingPenalty: number;
  fixedSharedPathPenalty: number;
  portDirectionPenalty: number;
  shapeBufferDistance: number;
  idealNudgingDistance: number;
  reverseDirectionPenalty: number;
  
  nudgeOrthogonalSegmentsConnectedToShapes: number;
  improveHyperedgeRoutesMovingJunctions: number;
  penaliseOrthogonalSharedPathsAtConnEnds: number;
  nudgeOrthogonalTouchingColinearSegments: number;
  performUnifyingNudgingPreprocessingStep: number;
  improveHyperedgeRoutesMovingAddingAndDeletingJunctions: number;
  nudgeSharedPathsWithCommonEndPoint: number;

  ConnEnd: ConnEnd;
  ConnRef: ConnRef;
  Point: Point;
  Polygon: Polygon;
  Rectangle: Rectangle;
  Router: Router;
  Obstacle: Obstacle;
  ShapeRef: ShapeRef;
  JunctionRef: JunctionRef;
  ShapeConnectionPin: ShapeConnectionPin;
  HyperedgeRerouter: HyperedgeRerouter;
  HyperedgeNewAndDeletedObjectLists: HyperedgeNewAndDeletedObjectLists;
  ConnEndListBuilder: ConnEndListBuilder;

  destroy(obj: any): void;
  getPointer(obj: any): number;
  wrapPointer<T>(ptr: number, Class: T): T;
}

export namespace AvoidLib {
  const avoidLib: Avoid | null;
  function load(filePath?: string): Promise<void>;
  function getInstance(): Avoid;
}
