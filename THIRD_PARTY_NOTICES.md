# Third-party notices

`@kind-ui/agent-ui` and its repository include material adapted from the projects below. Each entry names what was adapted, where it lives here, and its license. Full license texts follow.

## vercel-labs/ui

- Source: https://github.com/vercel-labs/ui, commit `220c1a0d7278872286a620a8e4ee4210ca46f9bd` (`.agents/skills/`, `.agents/experts/`, `.claude/agents/`, `scripts/expert-scope.mjs`).
- Used in: `.agents/skills/write-code`, `.agents/skills/unslop`, `.agents/skills/expert-review`, `.agents/skills/README.md`, `.agents/experts/`, `.claude/agents/`, `scripts/expert-scope.mjs`. Not shipped in the package.
- Changes: renamed the skills; rewrote the twin tables, commands and checks for this repository; replaced the per-framework experts with per-layer experts (core, react, web, styles, markdown); dropped the ESLint steps.
- Also adapted, from commit `a3a505994cda205c0d5c8fc9d4bee306ebe0f6b7`: `.agents/skills/ui-sdk-write-docs/SKILL.md` and `contributing/docs-writing.md`, merged into `.agents/skills/write-docs` with this site's page outline and references.
- Copyright 2026 Vercel, Inc. Licensed under the Apache License, Version 2.0.

## github/awesome-copilot

- Source: https://github.com/github/awesome-copilot, commit `8ecd5b17f02fe5fbebf35eccd1867265eded811f`, `skills/documentation-writer/SKILL.md`.
- Used in: `.agents/skills/documentation-writer`, installed unchanged with `npx skills add` (`skills-lock.json`). Not shipped in the package.
- Copyright GitHub, Inc. Licensed under the MIT License.

## emilkowalski/skills (Apple Design)

- Source: https://github.com/emilkowalski/skills, commit `64eb3deb9a5fbfa041faf783e0bc3fd635872e9c`, `skills/apple-design/SKILL.md`.
- Used in: `.agents/skills/apple-design/SKILL.md`, unchanged. Not shipped in the package.
- Copyright (c) 2026 Emil Kowalski. Licensed under the MIT License.

## pbakaus/impeccable

- Source: https://github.com/pbakaus/impeccable, commit `b49177d32788f2dc585c42831d845dacf1ebed2c` (version 4.10.0), the built skill in `.cursor/skills/impeccable/`: `SKILL.md` and `reference/audit.md`, `critique.md`, `critique-rubric.md`, `polish.md`, `distill.md` and `craft-floor.md`.
- Used in: `.agents/skills/impeccable/`. Not shipped in the package.
- Changes: `SKILL.md` cut to the `audit`, `critique`, `polish` and `distill` commands and the Operate and Read modes, with an "In this repository" section replacing the launcher setup; the references' launcher path (`.cursor/skills/impeccable/scripts/impeccable`) shortened to `impeccable`. The launcher, scripts, hooks, agents and the other commands and references are not included. The upstream `NOTICE.md` covers only files not included here.
- Copyright Paul Bakaus. Licensed under the Apache License, Version 2.0.

## vercel-labs/web-interface-guidelines

- Source: https://github.com/vercel-labs/web-interface-guidelines, commit `434b7f91364665f2f733b310ec54809bf8f37937`, `AGENTS.md`.
- Used in: `.agents/skills/web-interface-guidelines/SKILL.md`. Not shipped in the package.
- Changes: a skill header (`name`, `description`) added before the unchanged text.
- Copyright (c) 2025 Vercel Labs. Licensed under the MIT License.

## vercel/streamdown

- Source: https://github.com/vercel/streamdown, `packages/streamdown/lib/parse-blocks.tsx`.
- Used in: `packages/agent-ui/src/core/markdown/split.ts` (block splitting).
- Changes: ported to a framework-free incremental splitter that re-lexes only the text after final blocks; HTML-tag and math merging removed.
- Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.

## Lucide

- Source: https://github.com/lucide-icons/lucide, the `check`, `x`, `minus`, `arrow-down`, `copy`, `wrap-text`, `refresh-cw`, `pencil`, `chevron-left`, `chevron-right`, `arrow-up`, `paperclip`, `at-sign`, `square-slash`, `file`, `circle-alert`, `upload`, `thumbs-up`, `file-text`, `file-code`, `download`, `chevron-down`, `maximize-2`, `image-off`, `folder`, `folder-open`, `git-branch`, `plus`, `git-pull-request`, `book-open`, `settings-2`, `shield`, `mic` and `square` icon paths.
- Used in: `packages/agent-ui/src/styles/step.css` (Step status glyphs), `packages/agent-ui/src/styles/conversation.css` (the jump control's arrow), `packages/agent-ui/src/styles/agent-ui.css` (copy and copied), `packages/agent-ui/src/styles/code-block.css` (wrap) and `packages/agent-ui/src/styles/message.css` (regenerate, edit and the branch arrows), `packages/agent-ui/src/styles/composer.css` (send, attach, token kinds and token removal), `packages/agent-ui/src/styles/attachments.css` (file, error and removal) `packages/agent-ui/src/styles/uploader.css` (drop zone, file, done, error, cancel and retry) `packages/agent-ui/src/styles/feedback.css` (the thumbs) `packages/agent-ui/src/styles/document.css` (the document's kind, download and Show more) and `packages/agent-ui/src/styles/generated-image.css` (download, View full size and the failed image) and `packages/agent-ui/src/styles/file-tree.css` (file, folder and open folder) and `packages/agent-ui/src/styles/picker.css` (the trigger's chevron, the check and a page's chevrons) and `packages/agent-ui/src/styles/menu.css` (a submenu's chevron and a radio item's check) and `packages/agent-ui/src/styles/add-menu.css` (the plus) and `packages/agent-ui/src/styles/settings-menu.css` (the settings trigger) and `packages/agent-ui/src/styles/dictation.css` (the mic, Stop's square and Cancel's `x`), as CSS mask images; `folder`, `git-branch` and `plus` are inline SVG in `apps/docs/examples/picker/` and `upload`, `at-sign`, `git-pull-request` and `book-open` in `apps/docs/examples/add-menu/` and `folder` an image in `packages/agent-ui/tests/fixtures/shared/picker.ts` and `upload` and `file-text` images in `packages/agent-ui/tests/fixtures/shared/add-menu.ts`, none shipped; `chevron-right` is also inline SVG in `packages/agent-ui/src/react/file-tree.tsx` and `packages/agent-ui/src/web/file-tree.ts` (File Tree's folder arrow).
- Changes: Step's check, `x` and `minus` scaled to 62.5% about the center of their viewBox (stroke width 2.1875) so they mask the whole status mark; stroke width set to 3.5 (Step), 2.5 (Conversation), 2.25 and 2.5 (Composer), 3 (Attachments) and 2.25 and 2.5 (Uploader); Feedback adds a filled `thumbs-up` and turns it over for down; Dictation fills `square`; the others are unchanged.
- Licensed under the ISC License; the icons that derive from Feather (all but `wrap-text`, `pencil`, `paperclip`, `square-slash`, `file`, `file-code`, `image-off`, `folder-open` and `mic`) are also under the MIT License.
- Wave 6 icon paths, one line per component naming its stylesheet, its icons, any change and which icons derive from Feather (each task adds its line below its own marker, as `AGENTS.md` "Wave 6 shared-file markers" says):

<!-- wave-6-task-2: Thread List -->

  - `packages/agent-ui/src/styles/thread-list.css` (Thread List: New chat, More and the row menu's items): `plus`, `ellipsis`, `pencil`, `pin`, `share` and `trash-2`, unchanged; `plus`, `ellipsis` (`more-horizontal`), `share` and `trash-2` derive from Feather.

<!-- wave-6-task-3: Thread Search -->

  - `packages/agent-ui/src/styles/thread-search.css`: `search` (the trigger's icon), unchanged; derives from Feather.

<!-- wave-6-task-4: Sidebar -->

- `packages/agent-ui/src/styles/sidebar.css` (Sidebar's trigger): `panel-left` and `panel-right`, unchanged; both derive from Feather.

<!-- wave-6-task-5: Launcher -->

- `packages/agent-ui/src/styles/launcher.css` (the launcher's button and Close): `message-circle` and `x`, unchanged; both derive from Feather.

<!-- wave-6-task-6: Day Separator -->

<!-- wave-6-task-7: Connection Status -->

<!-- wave-6-task-8: Share Dialog -->

- Share Dialog: `packages/agent-ui/src/styles/share-dialog.css` (the trigger's glyph), `share`, unchanged, as a CSS mask image; it derives from Feather.

<!-- wave-6-task-9: Message author, time and outcomes -->

<!-- wave-6-task-10: Conversation states -->

<!-- wave-6-task-11: Conversation Search -->

- `packages/agent-ui/src/styles/conversation-search.css` (Conversation Search): `search`, `chevron-up`, `chevron-down` and `x`, unchanged; all derive from Feather.

## Lobe Icons

- Source: https://github.com/lobehub/lobe-icons, npm `@lobehub/icons-static-svg@1.103.0`, the `anthropic`, `openai`, `microsoft-color`, `gemini-color` and `xai` icons.
- Used in: `apps/docs/examples/model-selector/logos.tsx` (the Model Selector example and the Human Input showcase) and `packages/agent-ui/tests/fixtures/shared/model-logos.ts`. Not shipped in the package.
- Changes: path data unchanged; dropped `width`, `height`, `style` and `<title>`, added `aria-hidden`, and renamed Gemini's gradient ids.
- The logos are trademarks of their owners, used here only to name their models.
- Copyright (c) 2023 LobeHub. Licensed under the MIT License.

---

## Apache License 2.0

                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

---

## Lucide license

ISC License

Copyright (c) 2026 Lucide Icons and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

---

The following Lucide icons are derived from the Feather project:

airplay, alert-circle, alert-octagon, alert-triangle, aperture, arrow-down-circle, arrow-down-left, arrow-down-right, arrow-down, arrow-left-circle, arrow-left, arrow-right-circle, arrow-right, arrow-up-circle, arrow-up-left, arrow-up-right, arrow-up, at-sign, calendar, cast, check, chevron-down, chevron-left, chevron-right, chevron-up, chevrons-down, chevrons-left, chevrons-right, chevrons-up, circle, clipboard, clock, code, columns, command, compass, corner-down-left, corner-down-right, corner-left-down, corner-left-up, corner-right-down, corner-right-up, corner-up-left, corner-up-right, crosshair, database, divide-circle, divide-square, dollar-sign, download, external-link, feather, frown, hash, headphones, help-circle, info, italic, key, layout, life-buoy, link-2, link, loader, lock, log-in, log-out, maximize, meh, minimize, minimize-2, minus-circle, minus-square, minus, monitor, moon, more-horizontal, more-vertical, move, music, navigation-2, navigation, octagon, pause-circle, percent, plus-circle, plus-square, plus, power, radio, rss, search, server, share, shopping-bag, sidebar, smartphone, smile, square, table-2, tablet, target, terminal, trash-2, trash, triangle, tv, type, upload, x-circle, x-octagon, x-square, x, zoom-in, zoom-out

The MIT License (MIT) (for the icons listed above)

Copyright (c) 2013-present Cole Bemis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## github/awesome-copilot license

MIT License

Copyright GitHub, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## emilkowalski/skills license

MIT License

Copyright (c) 2026 Emil Kowalski

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## vercel-labs/web-interface-guidelines license

MIT License

Copyright (c) 2025 Vercel Labs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## Lobe Icons license

MIT License

Copyright (c) 2023 LobeHub

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
