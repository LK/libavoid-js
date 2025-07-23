# Shape Connection Pins in libavoid-js

## Overview

Shape Connection Pins allow you to define specific connection points on shapes where connectors can attach. When shapes are moved or resized, the pins (and any attached connectors) are automatically updated.

## Current Implementation Status

### Available Features

1. **ShapeConnectionPin Creation**: You can create pins on shapes with specified positions and properties
2. **Pin Properties**: Support for position, visibility directions, exclusivity, and connection costs
3. **Pin Position Queries**: You can get the current position of a pin
4. **Pin Updates**: Pins automatically move with their parent shapes

### Current Limitations

Due to WebIDL binding limitations, the `ConnEnd(ShapeRef*, pinClassId)` constructor is not available in the JavaScript binding. This means you cannot directly create a ConnEnd that references a shape pin by its class ID.

### Workaround

To connect to shape pins, you need to:
1. Create the ShapeConnectionPin
2. Query its position using `pin.position()`
3. Create a ConnEnd using the position: `new ConnEnd(pin.position())`
4. Update the connector endpoints when shapes move

## Usage Examples

### Basic Pin Creation

```javascript
// Create a pin on the right side of a shape
const pin = new Avoid.ShapeConnectionPin(
  shape,          // ShapeRef
  1,              // classId (unique identifier for this pin type)
  1.0,            // xOffset (0.0 = left, 1.0 = right)
  0.5,            // yOffset (0.0 = top, 1.0 = bottom)
  true,           // proportional (true = offsets are proportions)
  0.0,            // insideOffset (0 = on edge, positive = inside shape)
  Avoid.ConnDirRight  // visibility direction
);
```

### Connecting to Pins

```javascript
// Get pin position and create connector
const pinPos = pin.position();
const connRef = new Avoid.ConnRef(router);
connRef.setSourceEndpoint(new Avoid.ConnEnd(pinPos));
```

### Updating Connections After Shape Movement

```javascript
// After moving a shape
router.moveShape(shape, deltaX, deltaY);

// Update connector endpoints
const newPinPos = pin.position();
connRef.setSourceEndpoint(new Avoid.ConnEnd(newPinPos));
router.processTransaction();
```

## Pin Class IDs

Pin class IDs are used to identify different types of pins on a shape. You can define your own constants:

```javascript
const PIN_CLASSES = {
  INPUT: 1,
  OUTPUT: 2,
  POWER: 3,
  GROUND: 4,
  CENTER: 5
};
```

## Pin Properties

### Visibility Directions

Pins have visibility directions that determine from which sides they can be approached:
- `ConnDirUp`: Accessible from above
- `ConnDirDown`: Accessible from below
- `ConnDirLeft`: Accessible from left
- `ConnDirRight`: Accessible from right
- `ConnDirAll`: Accessible from all directions

You can combine directions using bitwise OR: `ConnDirUp | ConnDirRight`

### Exclusive Pins

Make a pin exclusive to allow only one connector:
```javascript
pin.setExclusive(true);
```

### Connection Costs

Set costs to influence routing preferences:
```javascript
pin.setConnectionCost(10.0); // Higher cost = less preferred
```

## Best Practices

1. **Use a Pin Manager**: Create a helper class to manage pins and their connections (see advanced example)
2. **Store Pin References**: Keep references to pins for easy updates
3. **Update After Movement**: Always update connector endpoints after moving shapes
4. **Use Meaningful Class IDs**: Define constants for pin types to make code more readable

## Future Improvements

The ideal implementation would support the C++ API's `ConnEnd(shape, pinClassId)` constructor, which would:
- Automatically track pin positions
- Update connectors when shapes move
- Choose the best pin when multiple pins share a class ID

Until this is available in the WebIDL binding, use the workarounds described above.