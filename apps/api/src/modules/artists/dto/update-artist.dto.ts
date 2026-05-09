import { UpdateArtistSchema } from '@repo/types/artists';
import { createZodDto } from 'nestjs-zod';

export class UpdateArtistDto extends createZodDto(UpdateArtistSchema) {}
