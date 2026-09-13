// macOS-only asset preparation. Usage: swift encode-background-reel.swift input output width height bitrate
// Writes a silent H.264 background rendition; the source is never modified.
import AVFoundation
import Foundation

let args = CommandLine.arguments
guard args.count == 6, let width = Int(args[3]), let height = Int(args[4]), let bitrate = Int(args[5]) else {
    fatalError("Expected input output width height bitrate")
}
guard !FileManager.default.fileExists(atPath: args[2]) else { fatalError("Output already exists") }
let asset = AVURLAsset(url: URL(fileURLWithPath: args[1]))
let track = asset.tracks(withMediaType: .video)[0]
let reader = try AVAssetReader(asset: asset)
let output = AVAssetReaderVideoCompositionOutput(videoTracks: [track], videoSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
let composition = AVMutableVideoComposition()
composition.renderSize = CGSize(width: width, height: height)
composition.frameDuration = CMTime(value: 1, timescale: 25)
let instruction = AVMutableVideoCompositionInstruction()
instruction.timeRange = CMTimeRange(start: .zero, duration: asset.duration)
let layer = AVMutableVideoCompositionLayerInstruction(assetTrack: track)
let natural = track.naturalSize.applying(track.preferredTransform)
let scale = min(CGFloat(width) / abs(natural.width), CGFloat(height) / abs(natural.height))
layer.setTransform(track.preferredTransform.concatenating(CGAffineTransform(scaleX: scale, y: scale)), at: .zero)
instruction.layerInstructions = [layer]
composition.instructions = [instruction]
output.videoComposition = composition
output.alwaysCopiesSampleData = false
reader.add(output)

let writer = try AVAssetWriter(outputURL: URL(fileURLWithPath: args[2]), fileType: .mp4)
writer.shouldOptimizeForNetworkUse = true
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: width, AVVideoHeightKey: height,
    AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: bitrate, AVVideoMaxKeyFrameIntervalKey: 50, AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel]
])
input.expectsMediaDataInRealTime = false
writer.add(input)
guard writer.startWriting(), reader.startReading() else { fatalError("Could not start media pipeline") }
writer.startSession(atSourceTime: .zero)
while let sample = output.copyNextSampleBuffer() {
    while !input.isReadyForMoreMediaData {
        if writer.status == .failed { fatalError("Writer failed: \(String(describing: writer.error))") }
        Thread.sleep(forTimeInterval: 0.005)
    }
    guard input.append(sample) else { fatalError("Encode failed: \(String(describing: writer.error))") }
}
guard reader.status == .completed else { fatalError("Read failed: \(String(describing: reader.error))") }
input.markAsFinished()
let finished = DispatchSemaphore(value: 0)
writer.finishWriting { finished.signal() }
finished.wait()
guard writer.status == .completed else { fatalError("Export failed: \(String(describing: writer.error))") }
print("Exported \(width)x\(height), \(CMTimeGetSeconds(asset.duration)) seconds, video only: \(args[2])")
