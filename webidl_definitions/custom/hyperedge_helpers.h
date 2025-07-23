#ifndef HYPEREDGE_HELPERS_H
#define HYPEREDGE_HELPERS_H

#include <libavoid/hyperedge.h>
#include <libavoid/connend.h>
#include <vector>

namespace Avoid {

// Helper class to build ConnEndList for JavaScript
class ConnEndListBuilder {
private:
    ConnEndList terminals;
    
public:
    ConnEndListBuilder() {}
    
    void addConnEnd(const ConnEnd& connEnd) {
        terminals.push_back(connEnd);
    }
    
    void addShapePin(ShapeRef* shape, unsigned int pinClassId) {
        terminals.push_back(ConnEnd(shape, pinClassId));
    }
    
    void addPoint(const Point& point, ConnDirFlags visDirs = ConnDirAll) {
        terminals.push_back(ConnEnd(point, visDirs));
    }
    
    void addJunction(JunctionRef* junction) {
        terminals.push_back(ConnEnd(junction));
    }
    
    void clear() {
        terminals.clear();
    }
    
    size_t size() const {
        return terminals.size();
    }
    
    // Get the internal list (for direct C++ use)
    const ConnEndList& getList() const {
        return terminals;
    }
    
    // Register this hyperedge with the router
    size_t registerHyperedge(HyperedgeRerouter* rerouter) {
        return rerouter->registerHyperedgeForRerouting(terminals);
    }
};

// Extension method for HyperedgeRerouter to work with our builder
inline size_t registerHyperedgeFromBuilder(HyperedgeRerouter* rerouter, ConnEndListBuilder* builder) {
    return rerouter->registerHyperedgeForRerouting(builder->getList());
}

} // namespace Avoid

#endif // HYPEREDGE_HELPERS_H