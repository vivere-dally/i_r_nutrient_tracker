export interface Food {
    id?: number;
    name: string;
    description?: string;
    image?: string;
    nutrientIds: number[];
}