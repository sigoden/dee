# Dee HttpErr Service

A service to handle http error for dee framework

## Usage

```ts
import * as DeeHttpErr from "@sigodenjs/dee-httperr";

Dee({
  services: {
    httperr: {
      initialize: DeeHttpErr.init,
      args: {
        ErrInvalidField: {
          status: 400,
          message: "field ${field} invalid"
        }
      }
    }
  }
});

// throw http error
throw srvs.httperr.ErrInvalidField.toError({ field: "id" });
// return error message
srvs.httperr.ErrInvalidField.resJSON(res, { field: "id" });
```
