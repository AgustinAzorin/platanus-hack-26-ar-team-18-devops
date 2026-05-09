import { CreateArtistSchema } from '@repo/types/artists';
import { createZodDto } from 'nestjs-zod';

export class CreateArtistDto extends createZodDto(CreateArtistSchema) {}
