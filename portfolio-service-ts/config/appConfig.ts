/*

Is this unnecessary?  I think it depends on how much help you want from your IDE.
If you want help from autocomplete or intellisense on that structure at design time
then it is necessary but that comes at the cost of having the maintain the interface.
I like it because it gives the direct feedback of not only structure but data type for
a dynamic configuration.  This does not give you any guarantees that your config is valid.
That feedback will have to come at runtime if you're using something like a yaml or json file.

*/

import config from 'config'
import * as appConfigProxy from './config.proxies';

export default appConfigProxy.AppConfigProxy.Create(config);
