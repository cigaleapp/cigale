import { ExportedProtocol } from '../protocol-types';

export type { ExportedProtocol };

export type MetadataEnumVariant = NonNullable<
	ExportedProtocol['metadata'][string]['options']
>[number];

export type Metadata = ExportedProtocol['metadata'][string];
