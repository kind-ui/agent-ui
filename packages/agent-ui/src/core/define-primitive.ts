import { definePrimitive as define } from "@ui-sdk/core";

// Whether UI SDK's development check reads `agent.actions` as an api is built: unknown until the first build.
let checked: boolean | undefined;

/**
 * UI SDK's `definePrimitive`, for actions offered only while available (spec §6). Such an action is an api getter
 * that gives `undefined` while it isn't, so the agent bridge, which reads the api at each snapshot, leaves it out.
 * UI SDK's development build reads `agent.actions` once right after it builds an instance's api, and warns about
 * each name that isn't a function then. So that read leaves out the names the api has but doesn't offer yet; a name
 * the api lacks still warns. Without the check (production), nothing reads the list as an api is built, so after the
 * first build every read gets the whole list.
 */
export const definePrimitive = ((definition: Parameters<typeof define>[0]) => {
  const { api, agent } = definition;
  const actions = agent?.actions;
  if (!actions) return define(definition);
  let built: Record<string, unknown> | undefined;
  return define({
    ...definition,
    api: (context) => {
      const made = api(context);
      if (checked === false) return made;
      built = made;
      queueMicrotask(() => {
        if (built === made) {
          checked = false;
          built = undefined;
        }
      });
      return made;
    },
    agent: {
      ...agent,
      get actions() {
        const made = built;
        if (!made) return actions;
        built = undefined;
        checked = true;
        return actions.filter((name) => !(name in made) || typeof made[name] === "function");
      },
    },
  });
}) as typeof define;
