export interface MapConfig {
    selector: string;
    placeId: string;
    apiUrl: string;
    //TODO: Double check
  }
  
  // LiteAPI place response structure
  export interface PlaceData {
    data: {
      location: {
        latitude: number;
        longitude: number;
      };
      viewport: {
        high: {
          latitude: number;
          longitude: number;
        };
        low: {
          latitude: number;
          longitude: number;
        };
      };
    };
  }
  