import { promises as fs, stat as statSync } from 'fs'
import { resolve, dirname, basename, extname } from 'path'
import { promisify } from 'util'
import * as core from '@actions/core'
import * as glob from '@actions/glob'
import { inlineHtml } from './html-inline.js'

const stat = promisify(statSync)

async function findFilesToProcess(
  searchPath: string
): Promise<{ files: string[]; rootDirectory: string }> {
  const globber = await glob.create(searchPath, {
    followSymbolicLinks: true,
    implicitDescendants: true,
    omitBrokenSymbolicLinks: true
  })

  const rawSearchResults = await globber.glob()
  const searchPaths = globber.getSearchPaths()
  const files: string[] = []

  for (const result of rawSearchResults) {
    const fileStats = await stat(result)
    if (!fileStats.isDirectory()) {
      if (result.toLowerCase().endsWith('.html')) {
        core.debug(`File: ${result} was found using the provided searchPath`)
        files.push(result)
      }
    } else {
      core.debug(`Removing ${result} from results because it is a directory`)
    }
  }

  if (files.length === 1 && searchPaths[0] === files[0]) {
    return {
      files,
      rootDirectory: dirname(files[0])
    }
  }

  return {
    files,
    rootDirectory: searchPaths[0]
  }
}

export async function main(): Promise<void> {
  try {
    const path = core.getInput('path', { required: true })
    const inputPrefix = core.getInput('prefix')
    const inputSuffix = core.getInput('suffix')
    const overwrite = core.getBooleanInput('overwrite')

    const ignoreStyles = core.getBooleanInput('ignore-styles')
    const ignoreScripts = core.getBooleanInput('ignore-scripts')
    const ignoreImages = core.getBooleanInput('ignore-images')
    const ignoreLinks = core.getBooleanInput('ignore-links')

    let prefix = ''
    let suffix = ''

    if (inputPrefix !== undefined) {
      prefix = inputPrefix
    }

    if (inputSuffix !== undefined) {
      suffix = inputSuffix
    }

    if (inputPrefix === undefined && inputSuffix === undefined) {
      prefix = 'inlined-'
    }

    const searchResult = await findFilesToProcess(path)

    if (searchResult.files.length === 0) {
      core.warning(
        `No HTML files were found with the provided path: ${path}. No files will be processed.`
      )
      return
    }

    const s = searchResult.files.length === 1 ? '' : 's'
    core.info(
      `With the provided path, there will be ${searchResult.files.length} file${s} processed`
    )
    core.debug(`Root directory is ${searchResult.rootDirectory}`)

    for (const filePath of searchResult.files) {
      try {
        await fs.access(filePath)
      } catch {
        core.error(`File not accessible: ${filePath}`)
        continue
      }

      const inlinedHtml = await inlineHtml(filePath, {
        ignoreStyles,
        ignoreScripts,
        ignoreImages,
        ignoreLinks
      })

      let outputPath: string

      if (overwrite) {
        outputPath = filePath
      } else {
        const dir = dirname(filePath)
        const name = basename(filePath, extname(filePath))
        const ext = extname(filePath)

        let outputFileName: string
        if (prefix && suffix) {
          outputFileName = `${prefix}${name}${suffix}${ext}`
        } else if (prefix && !suffix) {
          outputFileName = `${prefix}${name}${ext}`
        } else if (!prefix && suffix) {
          if (suffix.startsWith('.')) {
            outputFileName = `${name}${suffix}${ext}`
          } else {
            outputFileName = `${name}${suffix}${ext}`
          }
        } else {
          outputFileName = `${name}-inlined${ext}`
        }

        outputPath = resolve(dir, outputFileName)
      }

      await fs.writeFile(outputPath, inlinedHtml, 'utf-8')

      if (overwrite) {
        core.info(`Overwritten: ${filePath}`)
      } else {
        core.info(`Processed: ${filePath} -> ${outputPath}`)
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`Error processing files: ${error.message}`)
    } else {
      core.setFailed('Error processing files: Unknown error')
    }
    return
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
