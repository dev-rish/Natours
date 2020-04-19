/* eslint-disable */
export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoia2VicnVtb3RpcyIsImEiOiJjazh6cXNyNmwxazRxM3BzN2Uwc3d6c29wIn0.c-hMoTe2cFvtbHlKQ-XdKQ';
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/kebrumotis/ck8zqy4tn01wf1im4tpgswlx8',
    center: [-118.6919229, 34.0201613],
    scrollZoom: false,
    showZoom: true
    // zoom: 10,
    // interactive: false
  })
    // Add zoom and rotation controls to the map.
    .addControl(new mapboxgl.NavigationControl({ showCompass: false }));

  const bounds = new mapboxgl.LngLatBounds();
  locations.forEach(loc => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current locations
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};
