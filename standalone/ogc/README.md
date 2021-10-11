## Standalone Implementations of OGC Feature API 

### geofencing
An implementation that uses a dataset of windmills, as the user move's around using
the arrow keys, if the user enters the vicinity of a windmill they will be notified
they are approaching the given windmill. A live demo can be found [here](https://ahmadayubi.github.io/features-api-implementations/standalone/ogc/geofencing/).

Requires:

- web browser

### simulated-annealing
An implementation that tries to find the shortest path between all the windmills requested
from a pygeoapi. Finding the shortest path is done using the [simulated annealing](https://en.wikipedia.org/wiki/Simulated_annealing) algorithm.

Requires:

- Python
- Jupyter notebook (packages required by the notebook can be found inside the notebook)