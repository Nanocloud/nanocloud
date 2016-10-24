import os
import sys
import vs_toolchain

if sys.platform == 'win32':
    vs_toolchain.GetToolchainDir()
    os.environ['PATH'] += os.pathsep + os.environ['GYP_MSVS_OVERRIDE_PATH'] + '\\VC\\bin'

#!/usr/bin/env python

# Copyright (c) 2011 The WebRTC project authors. All Rights Reserved.
#
# Use of this source code is governed by a BSD-style license
# that can be found in the LICENSE file in the root of the source
# tree. An additional intellectual property rights grant can be found
# in the file PATENTS.  All contributing project authors may
# be found in the AUTHORS file in the root of the source tree.

# Searches for libraries or object files on the specified path and merges them
# them into a single library. Assumes ninja is used on all platforms.

import fnmatch
import os
import subprocess
import sys

IGNORE_PATTERNS = ['do_not_use', 'protoc', 'genperf']

def FindFiles(path, pattern):
  """Finds files matching |pattern| under |path|.

  Returns a list of file paths matching |pattern|, by walking the directory tree
  under |path|. Filenames containing the string 'do_not_use' or 'protoc' are
  excluded.

  Args:
    path: The root path for the search.
    pattern: A shell-style wildcard pattern to match filenames against.
        (e.g. '*.a')

  Returns:
    A list of file paths, relative to the current working directory.
  """
  files = []
  for root, _, filenames in os.walk(path):
    for filename in fnmatch.filter(filenames, pattern):
      if all(pattern not in filename for pattern in IGNORE_PATTERNS):
        # We use the relative path here to avoid "argument list too
        # long" errors on Linux.  Note: This doesn't always work, so
        # we use the find command on Linux.
        files.append(os.path.relpath(os.path.join(root, filename)))
  return files


def main(argv):
  if len(argv) != 3:
    sys.stderr.write('Usage: ' + argv[0] + ' <search_path> <output_lib>\n')
    return 1

  search_path = os.path.normpath(argv[1])
  output_lib = os.path.normpath(argv[2])

  if not os.path.exists(search_path):
    sys.stderr.write('search_path does not exist: %s\n' % search_path)
    return 1

  if os.path.isfile(output_lib):
    os.remove(output_lib)

  if sys.platform.startswith('linux'):
    pattern = '*.o'
    cmd = 'ar crs'
  elif sys.platform == 'darwin':
    pattern = '*.a'
    cmd = 'libtool -static -v -o '
  elif sys.platform == 'win32':
    pattern = '*.lib'
    cmd = 'lib /OUT:'
  else:
    sys.stderr.write('Platform not supported: %r\n\n' % sys.platform)
    return 1

  if sys.platform.startswith('linux'):
    cmd = ' '.join(['find', search_path, '-name "' + pattern + '"' +
                    ' -and -not -name ' +
                    ' -and -not -name '.join(IGNORE_PATTERNS) +
                    ' -exec', cmd, output_lib, '{} +'])
  else:
    cmd = ' '.join([cmd + output_lib] + FindFiles(search_path, pattern))

  if sys.platform == 'win32':
    cmd += ' src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_avx/vp9_diamond_search_sad_avx.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_avx2/fwd_txfm_avx2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_avx2/loopfilter_avx2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_avx2/sad4d_avx2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_avx2/sad_avx2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_avx2/variance_avx2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_avx2/variance_impl_avx2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_avx2/vp9_error_intrin_avx2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_avx2/vpx_subpixel_8t_intrin_avx2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_mmx/idct_blk_mmx.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_mmx/vp8_enc_stubs_mmx.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_sse2/avg_intrin_sse2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_sse2/denoising_sse2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_sse2/fwd_txfm_sse2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_sse2/highbd_loopfilter_sse2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_sse2/highbd_quantize_intrin_sse2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_sse2/highbd_variance_sse2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_sse2/idct_blk_sse2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_sse2/inv_txfm_sse2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_sse2/loopfilter_sse2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_sse2/quantize_sse2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_sse2/sum_squares_sse2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_sse2/variance_sse2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_sse2/vp8_enc_stubs_sse2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_sse2/vp8_quantize_sse2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_sse2/vp9_dct_intrin_sse2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_sse2/vp9_denoiser_sse2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_sse2/vp9_highbd_block_error_intrin_sse2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_sse2/vp9_idct_intrin_sse2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_sse2/vp9_quantize_sse2.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_sse4_1/quantize_sse4.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_ssse3/quantize_ssse3.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_ssse3/vp9_dct_ssse3.obj  src/out/Default/obj/third_party/libvpx/libvpx_intrinsics_ssse3/vpx_subpixel_8t_intrin_ssse3.obj'
  
  print cmd
  subprocess.check_call(cmd, shell=True)
  return 0

if __name__ == '__main__':
  sys.exit(main(sys.argv))
