/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { DATA_ORIGIN } from "../components/map/layers/sources/source";
import { VectorSource } from "../components/map/layers/sources/vector_source";
import { TMSSource } from "../components/map/layers/sources/tms_source";
import { VectorLayer } from "../components/map/layers/vector_layer";
import { TileLayer } from "../components/map/layers/tile_layer";

export const SET_SELECTED_LAYER = 'SET_SELECTED_LAYER';
export const UPDATE_LAYER_ORDER = 'UPDATE_LAYER_ORDER';
export const ADD_LAYER = 'ADD_LAYER';
export const LAYER_LOADING = 'LAYER_LOADING';
export const REMOVE_LAYER = 'REMOVE_LAYER';
export const PROMOTE_TEMPORARY_LAYERS = 'PROMOTE_TEMPORARY_LAYERS';
export const CLEAR_TEMPORARY_LAYERS = 'CLEAR_TEMPORARY_LAYERS';
export const ADD_VECTOR_SOURCE = 'ADD_VECTOR_SOURCE';
export const ADD_TMS_SOURCE = 'ADD_TMS_SOURCE';

export function setSelectedLayer(layerId) {
  return {
    type: SET_SELECTED_LAYER,
    selectedLayer: layerId
  };
}

export function updateLayerOrder(newLayerOrder) {
  return {
    type: UPDATE_LAYER_ORDER,
    newLayerOrder
  };
}

export function addLayer(layer) {
  return dispatch => {
    dispatch({
      type: ADD_LAYER,
      layer
    });
    dispatch(layerLoading(false));
  };
}

export function layerLoading(loadingBool) {
  return {
    type: LAYER_LOADING,
    loadingBool
  };
}

export function promoteTemporaryLayers() {
  return {
    type: PROMOTE_TEMPORARY_LAYERS
  };
}

export function clearTemporaryLayers() {
  return {
    type: CLEAR_TEMPORARY_LAYERS
  };
}

export function addVectorLayer(sourceName, layerName, options = {}) {
  return async (dispatch, getState) => {
    dispatch(layerLoading(true));
    const { map } = getState();
    const vectorSource = map.sources.find(({ name }) => name === sourceName);
    const layerSource = vectorSource.service.find(({ name }) => name === layerName);
    const vectorFetch = await fetch(layerSource.url);
    vectorFetch.json().then(resolvedResource => {
      const layer = VectorLayer.create({
        layerName,
        source: resolvedResource,
        ...options
      });
      dispatch(addLayer(layer));
    });
  };
}

export function addTileLayer(sourceName, layerName, options = {}) {
  return (dispatch, getState) => {
    dispatch(layerLoading(true));
    const { map } = getState();
    const tmsSource = map.sources.find(({ name }) => name === sourceName);
    const service = tmsSource.service.find(({ id }) => id === layerName);
    const layer = TileLayer.create({
      layerName,
      source: service.url,
      ...options
    });
    dispatch(addLayer(layer));
  };
}

export function removeLayer(layerName) {
  return {
    type: REMOVE_LAYER,
    layerName
  };
}

export function addTMSSource(dataOrigin, service, sourceName) {
  return dispatch => {
    const tms = TMSSource.create({
      dataOrigin,
      service,
      name: sourceName
    });
    dispatch({
      type: ADD_TMS_SOURCE,
      tms
    });
  };
}

export function addVectorSource(dataOrigin, service, sourceName) {
  return dispatch => {
    const vectorSource = VectorSource.create({
      dataOrigin,
      service,
      name: sourceName
    });
    dispatch({
      type: ADD_VECTOR_SOURCE,
      vectorSource
    });
  };
}

export async function loadMapResources(serviceSettings, dispatch) {

  const tmsSource = await serviceSettings.getTMSServices();
  const emsSource = await serviceSettings.getFileLayers();

  // Sample TMS Road Map Source
  dispatch(addTMSSource(DATA_ORIGIN.EMS, tmsSource, 'road_map_source'));
  // Sample TMS OSM Source
  dispatch(addTMSSource(DATA_ORIGIN.TMS,
    [{ url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png' }], 'osm_source'));
  // EMS Vector Source
  dispatch(addVectorSource(DATA_ORIGIN.CONFIG, emsSource, 'ems_source'));

  // Add initial layers
  dispatch(addTileLayer('road_map_source', 'road_map'));
  dispatch(addTileLayer('osm_source', 'osm'));
  dispatch(addVectorLayer('ems_source', 'World Countries'));
}