import * as dates from 'date-fns';
import { fr } from 'date-fns/locale';
import { beforeEach, vi } from 'vitest';

beforeEach(() => {
	dates.setDefaultOptions({ locale: fr });
	vi.stubGlobal('console', {
		...console,
		debug: () => {}
	});
});
