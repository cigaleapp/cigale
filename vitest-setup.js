import * as dates from 'date-fns';
import { fr } from 'date-fns/locale';
import { beforeEach } from 'vitest';

beforeEach(() => {
	dates.setDefaultOptions({ locale: fr });
});
