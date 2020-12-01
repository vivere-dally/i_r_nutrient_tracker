export enum EntityState {
    ADDED,
    UPDATED,
    DELETED,
    UNCHANGED
};

export interface Entity<T> {
    id?: T;
    entityState?: EntityState;
    etag?: string;
    hasConflict?: boolean;
};
