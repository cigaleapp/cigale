import { beforeEach } from 'vitest';
import * as dates from 'date-fns';
import { fr } from 'date-fns/locale';

beforeEach(() => {
	dates.setDefaultOptions({ locale: fr });
});
